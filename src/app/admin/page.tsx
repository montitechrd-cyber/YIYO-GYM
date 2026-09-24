import Link from "next/link";
import { Users, DollarSign, CreditCard, UserCog, ArrowRight } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clientesConPerfil, nombreVisible } from "@/lib/datos";
import {
  Encabezado,
  Insignia,
  Metrica,
  Tarjeta,
  TituloTarjeta,
  Vacio,
} from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";

const MONEDA = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function ResumenAdmin() {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const desde = inicioMes.toISOString();

  const [
    { count: totalClientes },
    { count: totalUsuarios },
    { data: suscripciones },
    { data: pagosMes },
    { data: ultimosPagos },
    clientes,
  ] = await Promise.all([
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase.from("perfiles").select("id", { count: "exact", head: true }),
    supabase.from("suscripciones").select("estado"),
    supabase.from("pagos").select("monto").gte("fecha", desde),
    supabase.from("pagos").select("*").order("fecha", { ascending: false }).limit(6),
    clientesConPerfil(),
  ]);

  const pagos = ultimosPagos ?? [];
  const perfilPorCliente = new Map(clientes.map((c) => [c.id, c.perfil]));

  const activas = (suscripciones ?? []).filter((s) => s.estado === "activa").length;
  const ingresos = (pagosMes ?? []).reduce((t, p) => t + Number(p.monto), 0);

  return (
    <div>
      <Encabezado
        titulo="Panel de administración"
        descripcion="Salud del negocio YIYO GYM en tiempo real."
        acciones={
          <BotonEnlace href="/admin/analytics">
            Ver analytics
            <ArrowRight size={16} />
          </BotonEnlace>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          etiqueta="Ingresos del mes"
          valor={MONEDA.format(ingresos)}
          detalle="Pagos registrados"
          icono={DollarSign}
          destacada
        />
        <Metrica
          etiqueta="Suscripciones activas"
          valor={activas}
          detalle={`${suscripciones?.length ?? 0} en total`}
          icono={CreditCard}
        />
        <Metrica
          etiqueta="Clientas"
          valor={totalClientes ?? 0}
          detalle="Fichas en el CRM"
          icono={Users}
        />
        <Metrica
          etiqueta="Usuarios"
          valor={totalUsuarios ?? 0}
          detalle="Cuentas registradas"
          icono={UserCog}
        />
      </div>

      <div className="mt-6">
        <Tarjeta>
          <TituloTarjeta
            extra={
              <Link
                href="/admin/planes"
                className="text-xs font-light text-violeta-600 underline-offset-4 hover:underline"
              >
                Planes y pagos
              </Link>
            }
          >
            Últimos pagos
          </TituloTarjeta>

          {pagos.length > 0 ? (
            <ul className="space-y-3">
              {pagos.map((p) => {
                const nombre = nombreVisible(perfilPorCliente.get(p.cliente_id));
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-lila-200 px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-violeta-800">{nombre}</p>
                      <p className="mt-1 text-xs font-light text-violeta-900/50">
                        {new Date(p.fecha).toLocaleDateString("es-DO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Insignia tono={p.estado === "completado" ? "verde" : "ambar"}>
                        {p.estado}
                      </Insignia>
                      <span className="text-sm font-medium text-violeta-700">
                        {MONEDA.format(Number(p.monto))}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vacio
              icono={CreditCard}
              titulo="Sin pagos todavía"
              descripcion="Cuando una clienta se suscriba, el pago aparecerá aquí."
            />
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
