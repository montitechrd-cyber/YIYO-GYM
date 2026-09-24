"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clienteActual, exigirPerfil } from "@/lib/autenticacion";
import { hoyTexto } from "@/lib/programacion";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Registra un punto de progreso: peso, % de grasa, % de músculo, medidas y
 * fotos, en la fecha indicada.
 *
 * Lo puede registrar la propia clienta (sin `cliente_id` en el formulario)
 * o la entrenadora por ella —para dejar la primera medición al empezar, o
 * la actualización de cada mes— pasando `cliente_id`. Quién puede escribir
 * sobre quién ya lo decide la política de RLS de la tabla `progreso`; aquí
 * solo se resuelve la carpeta de fotos correcta en cada caso.
 */
export async function registrarProgreso(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirPerfil();
  const supabase = await crearClienteServidor();

  const clienteIdForm = texto(datos, "cliente_id");
  let clienteId: string;
  // Las fotos van en una carpeta privada por dueña —no por quien las sube—
  // para que la clienta pueda ver en su propio panel las que le suba Yiyo.
  let carpetaFotos: string;

  if (clienteIdForm) {
    if (perfil.rol === "cliente") return { error: "No autorizado." };
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, perfil_id")
      .eq("id", clienteIdForm)
      .maybeSingle();
    if (!cliente) return { error: "Esa clienta ya no existe." };
    clienteId = cliente.id;
    carpetaFotos = cliente.perfil_id;
  } else {
    const cliente = await clienteActual(perfil.id);
    if (!cliente) return { error: "No encontramos tu ficha de clienta." };
    clienteId = cliente.id;
    carpetaFotos = perfil.id;
  }

  const medidas: Record<string, number> = {};
  for (const [campo, valor] of datos.entries()) {
    if (!campo.startsWith("medida_") || typeof valor !== "string") continue;
    const n = numeroOpcional(valor.trim());
    if (n != null) medidas[campo.slice(7)] = n;
  }

  const fotos: string[] = [];
  for (const archivo of datos.getAll("fotos")) {
    if (!(archivo instanceof File) || archivo.size === 0) continue;
    const extension = archivo.name.split(".").pop() ?? "jpg";
    const ruta = `${carpetaFotos}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("progreso")
      .upload(ruta, archivo, { contentType: archivo.type });

    if (error) return { error: `No se pudo subir la foto: ${error.message}` };
    fotos.push(ruta);
  }

  const { error } = await supabase.from("progreso").upsert(
    {
      cliente_id: clienteId,
      fecha: texto(datos, "fecha") || hoyTexto(),
      peso_kg: numeroOpcional(texto(datos, "peso_kg")),
      grasa_pct: numeroOpcional(texto(datos, "grasa_pct")),
      musculo_pct: numeroOpcional(texto(datos, "musculo_pct")),
      notas: texto(datos, "notas") || null,
      medidas,
      fotos,
    },
    { onConflict: "cliente_id,fecha" }
  );

  if (error) return { error: error.message };

  revalidatePath("/panel");
  revalidatePath("/panel/progreso");
  revalidatePath(`/entrenador/clientes/${clienteId}/progreso`);
  return { exito: "Progreso registrado." };
}

export async function borrarProgreso(id: string) {
  await exigirPerfil();
  const supabase = await crearClienteServidor();
  await supabase.from("progreso").delete().eq("id", id);
  revalidatePath("/panel/progreso");
}
