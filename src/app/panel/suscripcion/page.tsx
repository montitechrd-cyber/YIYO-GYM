import { CreditCard, Receipt } from "lucide-react";
import { exigirPerfil, clienteActual } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { paypalConfigurado } from "@/lib/paypal";
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
  Vacio,
} from "@/components/panel/piezas";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnlace } from "@/components/ui/boton";
import { SelectorPlanes } from "./selector-planes";
import { CancelarSuscripcion } from "./cancelar";

export default async function MiSuscripcion() {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);

  if (!cliente) {
    return (
      <div>
        <Encabezado titulo="Mi suscripción" />
        <Vacio
          icono={CreditCard}
          titulo="Sin ficha activa"
          descripcion="Completa tu evaluación inicial antes de elegir un plan"
          accion={<BotonEnlace href="/panel/bienvenida">Empezar</BotonEnlace>}
        />
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const [{ data: planes }, { data: suscripcion }, { data: pagos }] =
    await Promise.all([
      supabase.from("planes").select("*").eq("activo", true).order("orden"),
      supabase
        .from("suscripciones")
        .select("*")
        .eq("cliente_id", cliente.id)
        .order("creado_en", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("pagos")
        .select("*")
        .eq("cliente_id", cliente.id)
        .order("fecha", { ascending: false })
        .limit(12),
    ]);

  const listaPlanes = planes ?? [];
  const planActual = suscripcion
    ? listaPlanes.find((p) => p.id === suscripcion.plan_id)
    : null;

  const tieneActiva =
    suscripcion?.estado === "activa" || suscripcion?.estado === "prueba";

  return (
    <div>
      <Encabezado
        titulo="Mi suscripción"
        descripcion="Gestiona tu plan y consulta tus pagos"
      />

      {!paypalConfigurado() && (
        <Aviso tono="info" className="mb-6">
          Los pagos con PayPal aún no están configurados. Añade tus credenciales de
          PayPal en el archivo <code>.env.local</code> para activar el cobro.
        </Aviso>
      )}

      {suscripcion && planActual ? (
        <div className="space-y-5">
          <Tarjeta className="fondo-degradado border-transparent text-white">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-[10px] tracking-[0.22em] text-lila-100 uppercase">
                  Plan actual
                </p>
                <p className="mt-3 text-4xl font-light">{planActual.nombre}</p>
                <p className="mt-2 text-lila-100/85">
                  {MONEDA.format(Number(planActual.precio_mensual))} / mes
                </p>
              </div>
              <Insignia
                tono={TONO_SUSCRIPCION[suscripcion.estado]}
                className="bg-white/20 text-white"
              >
                {ESTADOS_SUSCRIPCION[suscripcion.estado]}
              </Insignia>
            </div>

            <dl className="mt-8 grid gap-5 border-t border-white/20 pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] tracking-[0.18em] text-lila-100 uppercase">
                  Inicio
                </dt>
                <dd className="mt-1 font-light">
                  {suscripcion.inicio
                    ? FECHA_LARGA.format(fechaLocal(suscripcion.inicio))
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] text-lila-100 uppercase">
                  Próximo cobro
                </dt>
                <dd className="mt-1 font-light">
                  {suscripcion.proximo_cobro
                    ? FECHA_LARGA.format(fechaLocal(suscripcion.proximo_cobro))
                    : "—"}
                </dd>
              </div>
            </dl>

            {tieneActiva && (
              <div className="mt-7">
                <CancelarSuscripcion id={suscripcion.id} />
              </div>
            )}
          </Tarjeta>

          {!tieneActiva && (
            <SelectorPlanes
              planes={listaPlanes}
              clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? null}
            />
          )}
        </div>
      ) : (
        <SelectorPlanes
          planes={listaPlanes}
          clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? null}
        />
      )}

      <div className="mt-6">
        <Tarjeta>
          <TituloTarjeta>
            <span className="flex items-center gap-2">
              <Receipt size={13} /> Historial de pagos
            </span>
          </TituloTarjeta>

          {pagos && pagos.length > 0 ? (
            <ul className="space-y-3">
              {pagos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-lila-200 px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-violeta-800">
                      {MONEDA.format(Number(p.monto))}
                    </p>
                    <p className="mt-1 text-xs font-light text-violeta-900/50">
                      {FECHA_LARGA.format(new Date(p.fecha))}
                    </p>
                  </div>
                  <Insignia tono={p.estado === "completado" ? "verde" : "ambar"}>
                    {p.estado}
                  </Insignia>
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
