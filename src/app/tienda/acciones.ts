"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { WHATSAPP_YIYO } from "@/lib/contacto";

export type LineaPedido = {
  productoId: string;
  talla: string | null;
  cantidad: number;
};

export type ResultadoPedido =
  | { error: string }
  | { numero: number; enlaceWhatsApp: string };

/**
 * Registra un pedido de la tienda.
 *
 * Los precios se leen de la base, nunca del navegador: si se confiara en lo
 * que manda el carrito, cualquiera podría pedir los leggings a un dólar
 * cambiando un valor en su propia pantalla.
 *
 * El pedido queda guardado aunque el aviso por WhatsApp no llegue a
 * enviarse. La plataforma es la fuente de verdad; el WhatsApp solo avisa.
 */
export async function crearPedido(
  datos: FormData,
  lineas: LineaPedido[]
): Promise<ResultadoPedido> {
  const texto = (k: string) => String(datos.get(k) ?? "").trim();

  const nombre = texto("nombre");
  const telefono = texto("telefono");
  const correo = texto("correo");
  const entrega = texto("entrega");
  const notas = texto("notas");

  if (!nombre) return { error: "Escribe tu nombre para poder contactarte." };
  if (!telefono) return { error: "Escribe un teléfono o WhatsApp de contacto." };
  if (lineas.length === 0) return { error: "Tu carrito está vacío." };

  const supabase = await crearClienteServidor();

  // Se piden los productos reales para tomar de ahí nombre y precio.
  const ids = [...new Set(lineas.map((l) => l.productoId))];
  const { data: productos, error: errorProductos } = await supabase
    .from("productos")
    .select("id, nombre, precio, tallas, activo")
    .in("id", ids);

  if (errorProductos) {
    return { error: "No pudimos consultar el catálogo. Inténtalo otra vez." };
  }

  const porId = new Map((productos ?? []).map((p) => [p.id, p]));
  const items: {
    producto_id: string;
    nombre: string;
    talla: string | null;
    cantidad: number;
    precio_unitario: number;
  }[] = [];

  for (const linea of lineas) {
    const p = porId.get(linea.productoId);
    if (!p || !p.activo) {
      return {
        error:
          "Uno de los productos ya no está disponible. Revisa tu carrito y vuelve a intentarlo.",
      };
    }
    const cantidad = Math.floor(linea.cantidad);
    if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > 99) {
      return { error: `La cantidad de «${p.nombre}» no es válida.` };
    }
    // Un producto con tallas necesita una de las suyas; uno de talla única
    // no admite ninguna.
    if (p.tallas.length > 0 && !p.tallas.includes(linea.talla ?? "")) {
      return { error: `Elige una talla para «${p.nombre}».` };
    }
    items.push({
      producto_id: p.id,
      nombre: p.nombre,
      talla: p.tallas.length > 0 ? linea.talla : null,
      cantidad,
      precio_unitario: Number(p.precio),
    });
  }

  const total = items.reduce((t, i) => t + i.precio_unitario * i.cantidad, 0);

  // Si quien compra tiene sesión abierta y ficha de clienta, se enlaza para
  // que Yiyo vea el pedido junto al resto de su historial.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let clienteId: string | null = null;
  if (user) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("perfil_id", user.id)
      .maybeSingle();
    clienteId = cliente?.id ?? null;
  }

  const { data: pedido, error: errorPedido } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: clienteId,
      nombre,
      telefono,
      correo: correo || null,
      entrega: entrega || null,
      notas: notas || null,
      total: Number(total.toFixed(2)),
    })
    .select("id, numero")
    .single();

  if (errorPedido || !pedido) {
    return { error: "No pudimos registrar tu pedido. Inténtalo otra vez." };
  }

  const { error: errorItems } = await supabase
    .from("pedido_items")
    .insert(items.map((i) => ({ ...i, pedido_id: pedido.id })));

  if (errorItems) {
    // Un pedido sin líneas no le sirve a nadie: mejor deshacerlo que dejar
    // a Yiyo con un aviso vacío que no sabe qué contiene.
    await supabase.from("pedidos").delete().eq("id", pedido.id);
    return { error: "No pudimos guardar los productos del pedido." };
  }

  revalidatePath("/admin/pedidos");

  return {
    numero: pedido.numero,
    enlaceWhatsApp: enlaceDeWhatsApp({
      numero: pedido.numero,
      nombre,
      telefono,
      entrega,
      notas,
      items,
      total,
    }),
  };
}

/** Deja el pedido escrito y listo para enviar por WhatsApp. */
function enlaceDeWhatsApp(p: {
  numero: number;
  nombre: string;
  telefono: string;
  entrega: string;
  notas: string;
  items: { nombre: string; talla: string | null; cantidad: number; precio_unitario: number }[];
  total: number;
}) {
  const dinero = (n: number) => `US$${n.toFixed(2)}`;
  const partes = [
    `Hola Yiyo, quiero hacer este pedido 🌸`,
    ``,
    `Pedido #${p.numero}`,
    ``,
    ...p.items.map(
      (i) =>
        `• ${i.cantidad} × ${i.nombre}${i.talla ? ` (talla ${i.talla})` : ""} — ${dinero(
          i.precio_unitario * i.cantidad
        )}`
    ),
    ``,
    `Total: ${dinero(p.total)}`,
    ``,
    `Nombre: ${p.nombre}`,
    `Teléfono: ${p.telefono}`,
  ];
  if (p.entrega) partes.push(`Entrega: ${p.entrega}`);
  if (p.notas) partes.push(`Notas: ${p.notas}`);

  return `https://wa.me/${WHATSAPP_YIYO}?text=${encodeURIComponent(partes.join("\n"))}`;
}
