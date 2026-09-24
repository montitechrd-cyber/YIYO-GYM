import { Package, Phone, Mail, MapPin } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { MONEDA, FECHA_LARGA } from "@/lib/etiquetas";
import { Encabezado, Tarjeta, Vacio } from "@/components/panel/piezas";
import { WHATSAPP_YIYO } from "@/lib/contacto";
import type { PedidoItem } from "@/lib/supabase/tipos";
import { SelectorEstado } from "./selector-estado";

/** Solo teléfono en dígitos: es lo que acepta wa.me. */
const soloDigitos = (t: string) => t.replace(/\D/g, "");

export default async function Pedidos() {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*")
    .order("creado_en", { ascending: false })
    .limit(200);

  const ids = (pedidos ?? []).map((p) => p.id);
  const { data: items } = ids.length
    ? await supabase.from("pedido_items").select("*").in("pedido_id", ids)
    : { data: [] as PedidoItem[] };

  const porPedido = new Map<string, PedidoItem[]>();
  for (const i of items ?? []) {
    porPedido.set(i.pedido_id, [...(porPedido.get(i.pedido_id) ?? []), i]);
  }

  const nuevos = (pedidos ?? []).filter((p) => p.estado === "nuevo").length;
  const facturado = (pedidos ?? [])
    .filter((p) => p.estado !== "cancelado")
    .reduce((t, p) => t + Number(p.total), 0);

  return (
    <div>
      <Encabezado
        titulo="Pedidos"
        descripcion={
          nuevos > 0
            ? `${nuevos} ${nuevos === 1 ? "pedido nuevo" : "pedidos nuevos"} por atender`
            : "Todo al día"
        }
      />

      {(pedidos ?? []).length === 0 ? (
        <Tarjeta>
          <Vacio
            icono={Package}
            titulo="Todavía no hay pedidos"
            descripcion="Cuando alguien compre en la tienda, el pedido aparecerá aquí con todo lo que pidió"
          />
        </Tarjeta>
      ) : (
        <>
          <p className="mb-5 text-xs font-light text-violeta-900/50">
            {(pedidos ?? []).length} pedidos · {MONEDA.format(facturado)} sin
            contar los cancelados
          </p>

          <div className="space-y-4">
            {(pedidos ?? []).map((p) => {
              const lineas = porPedido.get(p.id) ?? [];
              return (
                <Tarjeta key={p.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] tracking-[0.18em] text-violeta-500 uppercase">
                        Pedido #{p.numero}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-medium text-violeta-800">
                        {p.nombre}
                      </h2>
                      <p className="text-xs font-light text-violeta-900/50">
                        {FECHA_LARGA.format(new Date(p.creado_en))}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xl font-medium text-violeta-800">
                        {MONEDA.format(Number(p.total))}
                      </span>
                      <SelectorEstado pedidoId={p.id} estado={p.estado} />
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-lila-100 pt-4">
                    {lineas.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 font-light text-violeta-900/75">
                          <span className="font-medium text-violeta-800">
                            {l.cantidad}×
                          </span>{" "}
                          {l.nombre}
                          {l.talla && (
                            <span className="text-violeta-900/45">
                              {" "}
                              · talla {l.talla}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-violeta-900/60 tabular-nums">
                          {MONEDA.format(Number(l.precio_unitario) * l.cantidad)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-lila-100 pt-4 text-xs font-light text-violeta-900/65">
                    <a
                      href={`https://wa.me/${soloDigitos(p.telefono)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-violeta-600 hover:underline"
                    >
                      <Phone size={13} />
                      {p.telefono}
                    </a>
                    {p.correo && (
                      <a
                        href={`mailto:${p.correo}`}
                        className="flex items-center gap-1.5 text-violeta-600 hover:underline"
                      >
                        <Mail size={13} />
                        {p.correo}
                      </a>
                    )}
                    {p.entrega && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="shrink-0 text-lila-400" />
                        {p.entrega}
                      </span>
                    )}
                  </div>

                  {p.notas && (
                    <p className="mt-3 rounded-2xl bg-lila-50 px-4 py-3 text-xs font-light text-violeta-900/70">
                      {p.notas}
                    </p>
                  )}
                </Tarjeta>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-8 text-center text-[11px] font-light text-violeta-900/40">
        Los pedidos llegan también a tu WhatsApp {WHATSAPP_YIYO.replace(/^1/, "+1 ")}
      </p>
    </div>
  );
}
