import { AlertCircle } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { mapaPerfiles, nombreVisible } from "@/lib/datos";
import {
  ESTADOS_SUSCRIPCION,
  FECHA_LARGA,
  MONEDA,
  TONO_SUSCRIPCION,
  fechaLocal,
} from "@/lib/etiquetas";
import {
  Encabezado,
  Insignia,
  Tarjeta,
  TituloTarjeta,
} from "@/components/panel/piezas";
import { Aviso } from "@/components/ui/aviso";
import { GestorPlan } from "./gestor";

export default async function PlanesYPagos() {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();

  const [{ data: planes }, { data: suscripciones }, { data: pagos }] =
    await Promise.all([
      supabase.from("planes").select("*").order("orden"),
      supabase
        .from("suscripciones")
        .select("*")
        .order("creado_en", { ascending: false }),
      supabase
        .from("pagos")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(20),
    ]);

  const listaPlanes = planes ?? [];
  const listaSuscripciones = suscripciones ?? [];
  const listaPagos = pagos ?? [];

  const idsClientes = [
    ...new Set([
      ...listaSuscripciones.map((s) => s.cliente_id),
      ...listaPagos.map((p) => p.cliente_id),
    ]),
  ];

  const { data: clientes } = idsClientes.length
    ? await supabase.from("clientes").select("id, perfil_id").in("id", idsClientes)
    : { data: [] };

  const perfilPorCliente = new Map(
    (clientes ?? []).map((c) => [c.id, c.perfil_id])
  );
  const perfiles = await mapaPerfiles((clientes ?? []).map((c) => c.perfil_id));
  const nombreDe = (clienteId: string) =>
    nombreVisible(perfiles.get(perfilPorCliente.get(clienteId) ?? ""));

  const planPorId = new Map(listaPlanes.map((p) => [p.id, p]));
  const sinPaypal = listaPlanes.filter((p) => p.activo && !p.paypal_plan_id);

  return (
    <div>
      <Encabezado
        titulo="Planes y pagos"
        descripcion="Define los planes de suscripción y revisa el estado de los cobros"
        acciones={<GestorPlan modo="crear" />}
      />

      {sinPaypal.length > 0 && (
        <Aviso tono="info" className="mb-6">
          <span>
            {sinPaypal.length === 1
              ? `El plan «${sinPaypal[0].nombre}» no tiene`
              : `${sinPaypal.length} planes activos no tienen`}{" "}
            un <code>paypal_plan_id</code>. Créalo en tu panel de PayPal
            (Subscriptions → Plans) y pégalo aquí para poder cobrar.
          </span>
        </Aviso>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {listaPlanes.map((p) => (
          <article
            key={p.id}
            className={`rounded-4xl border p-7 transition-all duration-500 ${
              p.destacado
                ? "fondo-degradado border-transparent text-white shadow-suave"
                : "border-lila-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p
                className={`text-[10px] tracking-[0.22em] uppercase ${
                  p.destacado ? "text-lila-100" : "text-violeta-500"
                }`}
              >
                {p.nombre}
              </p>
              <Insignia
                tono={p.activo ? "verde" : "gris"}
                className={p.destacado ? "bg-white/20 text-white" : ""}
              >
                {p.activo ? "Activo" : "Oculto"}
              </Insignia>
            </div>

            <p
              className={`mt-4 text-4xl font-light ${
                p.destacado ? "text-white" : "text-violeta-800"
              }`}
            >
              {MONEDA.format(Number(p.precio_mensual))}
              <span className="ml-1 text-sm opacity-60">/mes</span>
            </p>

            <p
              className={`mt-3 flex items-center gap-1.5 text-[11px] font-light ${
                p.destacado ? "text-lila-100/80" : "text-violeta-900/50"
              }`}
            >
              {!p.paypal_plan_id && <AlertCircle size={12} />}
              {p.paypal_plan_id
                ? `PayPal: ${p.paypal_plan_id}`
                : "Sin plan de PayPal"}
            </p>

            <div className="mt-6">
              <GestorPlan modo="editar" plan={p} />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Tarjeta>
          <TituloTarjeta>Suscripciones</TituloTarjeta>
          {listaSuscripciones.length > 0 ? (
            <ul className="space-y-3">
              {listaSuscripciones.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-lila-200 px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-violeta-800">
                      {nombreDe(s.cliente_id)}
                    </p>
                    <p className="mt-1 text-xs font-light text-violeta-900/50">
                      {planPorId.get(s.plan_id)?.nombre ?? "Plan eliminado"}
                      {s.proximo_cobro
                        ? ` · próximo cobro ${FECHA_LARGA.format(fechaLocal(s.proximo_cobro))}`
                        : ""}
                    </p>
                  </div>
                  <Insignia tono={TONO_SUSCRIPCION[s.estado]}>
                    {ESTADOS_SUSCRIPCION[s.estado]}
                  </Insignia>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-light text-violeta-900/45">
              Todavía no hay suscripciones.
            </p>
          )}
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Pagos recientes</TituloTarjeta>
          {listaPagos.length > 0 ? (
            <ul className="space-y-3">
              {listaPagos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-lila-200 px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-violeta-800">
                      {nombreDe(p.cliente_id)}
                    </p>
                    <p className="mt-1 text-xs font-light text-violeta-900/50">
                      {FECHA_LARGA.format(new Date(p.fecha))}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-violeta-700">
                    {MONEDA.format(Number(p.monto))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-light text-violeta-900/45">
              Todavía no hay pagos registrados.
            </p>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
