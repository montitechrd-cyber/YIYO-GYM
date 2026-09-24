import {
  Activity,
  DollarSign,
  TrendingDown,
  UserPlus,
  Users,
} from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { mapaPerfiles, nombreVisible } from "@/lib/datos";
import { ESTADOS_CLIENTE, MONEDA, TONO_ESTADO_CLIENTE } from "@/lib/etiquetas";
import {
  Encabezado,
  Insignia,
  Metrica,
  Tarjeta,
  TituloTarjeta,
  Vacio,
} from "@/components/panel/piezas";
import { GraficaArea, GraficaBarras } from "@/components/panel/graficas-carga";
import type { EstadoCliente } from "@/lib/supabase/tipos";

const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Etiquetas de los últimos N meses, del más antiguo al actual. */
function ultimosMeses(n: number) {
  const hoy = new Date();
  return Array.from({ length: n }, (_, i) => {
    const f = new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1 - i), 1);
    return {
      clave: `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`,
      etiqueta: MESES_CORTOS[f.getMonth()],
    };
  });
}

/**
 * Mes de una fecha, en hora local.
 *
 * Los pagos guardan `timestamptz`, así que cortar el texto ISA a los siete
 * primeros caracteres da el mes en UTC: en República Dominicana (UTC-4) un
 * pago de la tarde del último día del mes se contaba en el mes siguiente.
 */
function mesDe(iso: string) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return iso.slice(0, 7);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
}

export default async function Analytics() {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();

  // Un año hacia atrás: de sobra para las gráficas por mes que se pintan.
  const inicioInforme = new Date();
  inicioInforme.setFullYear(inicioInforme.getFullYear() - 1);
  const desdeInforme = inicioInforme.toISOString();

  const [
    { data: clientes },
    { data: pagos },
    { data: suscripciones },
    { data: entrenamientos },
  ] = await Promise.all([
    supabase.from("clientes").select("*"),
    // El informe cubre los ultimos meses, asi que no hace falta escanear el
    // historico completo: se acota por fecha lo que crece sin tope.
    supabase
      .from("pagos")
      .select("monto, fecha, cliente_id")
      .gte("fecha", desdeInforme),
    supabase.from("suscripciones").select("estado, cliente_id, plan_id"),
    supabase
      .from("registros_entrenamiento")
      .select("fecha, cliente_id")
      .gte("fecha", desdeInforme),
  ]);

  const listaClientes = clientes ?? [];
  const listaPagos = pagos ?? [];
  const listaSuscripciones = suscripciones ?? [];
  const listaEntrenamientos = entrenamientos ?? [];

  const meses = ultimosMeses(6);

  const ingresosPorMes = meses.map((m) => ({
    fecha: m.etiqueta,
    ingresos: Number(
      listaPagos
        .filter((p) => mesDe(p.fecha) === m.clave)
        .reduce((t, p) => t + Number(p.monto), 0)
        .toFixed(2)
    ),
  }));

  const altasPorMes = meses.map((m) => ({
    fecha: m.etiqueta,
    altas: listaClientes.filter((c) => mesDe(c.fecha_alta) === m.clave).length,
  }));

  const entrenamientosPorMes = meses.map((m) => ({
    fecha: m.etiqueta,
    sesiones: listaEntrenamientos.filter((e) => mesDe(e.fecha) === m.clave).length,
  }));

  const mesActual = meses.at(-1)!.clave;
  const mesPrevio = meses.at(-2)?.clave;

  const ingresosMes = ingresosPorMes.at(-1)?.ingresos ?? 0;
  const ingresosPrevio = ingresosPorMes.at(-2)?.ingresos ?? 0;
  const variacion =
    ingresosPrevio > 0
      ? Math.round(((ingresosMes - ingresosPrevio) / ingresosPrevio) * 100)
      : null;

  const activas = listaSuscripciones.filter((s) => s.estado === "activa").length;
  const canceladas = listaSuscripciones.filter(
    (s) => s.estado === "cancelada"
  ).length;
  const churn =
    activas + canceladas > 0
      ? Math.round((canceladas / (activas + canceladas)) * 100)
      : 0;

  const porEstado = (Object.keys(ESTADOS_CLIENTE) as EstadoCliente[]).map((e) => ({
    estado: e,
    total: listaClientes.filter((c) => c.estado === e).length,
  }));

  // Desempeño por entrenadora: clientas asignadas y entrenamientos de sus clientas.
  const entrenadores = [
    ...new Set(listaClientes.map((c) => c.entrenador_id).filter(Boolean)),
  ] as string[];
  const perfilesEntrenadores = await mapaPerfiles(entrenadores);

  const desempeno = entrenadores
    .map((id) => {
      const suyas = listaClientes.filter((c) => c.entrenador_id === id);
      const idsSuyas = new Set(suyas.map((c) => c.id));
      return {
        id,
        nombre: nombreVisible(perfilesEntrenadores.get(id)),
        clientas: suyas.length,
        activas: suyas.filter((c) => c.estado === "activo").length,
        entrenamientos: listaEntrenamientos.filter((e) =>
          idsSuyas.has(e.cliente_id)
        ).length,
      };
    })
    .sort((a, b) => b.clientas - a.clientas);

  const clientasActivasMes = new Set(
    listaEntrenamientos
      .filter((e) => mesDe(e.fecha) === mesActual)
      .map((e) => e.cliente_id)
  ).size;

  const nuevasMes = altasPorMes.at(-1)?.altas ?? 0;
  const nuevasPrevio = mesPrevio ? (altasPorMes.at(-2)?.altas ?? 0) : 0;

  return (
    <div>
      <Encabezado
        titulo="Analytics"
        descripcion="Los últimos 6 meses del negocio"
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          etiqueta="Ingresos del mes"
          valor={MONEDA.format(ingresosMes)}
          detalle={
            variacion != null
              ? `${variacion >= 0 ? "+" : ""}${variacion}% vs. mes anterior`
              : "Sin comparativa"
          }
          icono={DollarSign}
          destacada
        />
        <Metrica
          etiqueta="Suscripciones activas"
          valor={activas}
          detalle={`${listaSuscripciones.length} en total`}
          icono={Users}
        />
        <Metrica
          etiqueta="Nuevas clientas"
          valor={nuevasMes}
          detalle={`${nuevasPrevio} el mes anterior`}
          icono={UserPlus}
        />
        <Metrica
          etiqueta="Tasa de cancelación"
          valor={`${churn}%`}
          detalle={`${canceladas} canceladas`}
          icono={TrendingDown}
        />
      </div>

      <div className="mt-6 space-y-5">
        <Tarjeta>
          <TituloTarjeta>Ingresos por mes</TituloTarjeta>
          <GraficaArea
            datos={ingresosPorMes}
            clave="ingresos"
            etiqueta="Ingresos"
            unidad=" USD"
          />
        </Tarjeta>

        <div className="grid gap-5 lg:grid-cols-2">
          <Tarjeta>
            <TituloTarjeta>Altas de clientas</TituloTarjeta>
            <GraficaBarras datos={altasPorMes} clave="altas" etiqueta="Altas" />
          </Tarjeta>

          <Tarjeta>
            <TituloTarjeta>
              Entrenamientos registrados
              <span className="ml-2 font-light normal-case">
                · {clientasActivasMes} clientas activas este mes
              </span>
            </TituloTarjeta>
            <GraficaBarras
              datos={entrenamientosPorMes}
              clave="sesiones"
              etiqueta="Sesiones"
            />
          </Tarjeta>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Tarjeta>
            <TituloTarjeta>Clientas por estado</TituloTarjeta>
            <ul className="space-y-3">
              {porEstado.map((x) => {
                const pct = listaClientes.length
                  ? Math.round((x.total / listaClientes.length) * 100)
                  : 0;
                return (
                  <li key={x.estado}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Insignia tono={TONO_ESTADO_CLIENTE[x.estado]}>
                        {ESTADOS_CLIENTE[x.estado]}
                      </Insignia>
                      <span className="text-sm font-light text-violeta-900/60">
                        {x.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-lila-100">
                      <div
                        className="h-full rounded-full fondo-degradado transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>

          <Tarjeta>
            <TituloTarjeta>Desempeño por entrenadora</TituloTarjeta>
            {desempeno.length > 0 ? (
              <ul className="space-y-3">
                {desempeno.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-lila-200 px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-violeta-800">
                        {d.nombre}
                      </p>
                      <p className="mt-1 text-xs font-light text-violeta-900/50">
                        {d.clientas} clientas · {d.activas} activas
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-light text-violeta-700">
                      <Activity size={14} className="text-lila-400" />
                      {d.entrenamientos}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vacio
                icono={Users}
                titulo="Sin entrenadoras asignadas"
                descripcion="Asigna clientas a una entrenadora para ver su desempeño"
              />
            )}
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
