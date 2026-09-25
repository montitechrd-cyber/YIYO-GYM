"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Salad,
  Trash2,
  X,
} from "lucide-react";
import {
  borrarSesion,
  cambiarEstadoSesion,
} from "@/app/entrenador/calendario/acciones";
import { ESTADOS_SESION, TONO_ESTADO_SESION } from "@/lib/etiquetas";
import { Insignia } from "@/components/panel/piezas";
import { cn } from "@/lib/utils";
import type { Sesion } from "@/lib/supabase/tipos";
import type { DiaDeAlimentacion } from "@/lib/agenda";

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export type SesionVisible = Sesion & { nombreCliente?: string };

/** Índice 0 = lunes. */
function primerDiaSemana(anio: number, mes: number) {
  return (new Date(anio, mes, 1).getDay() + 6) % 7;
}

/** La fecha de hoy no cambia sola; no hace falta suscribirse a nada. */
const sinSuscripcion = () => () => {};

function fechaLocalDeHoy() {
  const f = new Date();
  const m = String(f.getMonth() + 1).padStart(2, "0");
  const d = String(f.getDate()).padStart(2, "0");
  return `${f.getFullYear()}-${m}-${d}`;
}

function agrupar<T>(lista: T[], clave: (x: T) => string) {
  const mapa = new Map<string, T[]>();
  lista.forEach((x) => {
    const k = clave(x);
    const acumulado = mapa.get(k) ?? [];
    acumulado.push(x);
    mapa.set(k, acumulado);
  });
  return mapa;
}

export function Calendario({
  sesiones,
  alimentacion = [],
  nombresPorCliente,
  puedeGestionar = false,
  porCliente = false,
  prefijoEjercicios,
  hoy: hoyServidor,
}: {
  sesiones: SesionVisible[];
  /** Días cubiertos por un plan de alimentación, ya calculados. */
  alimentacion?: DiaDeAlimentacion[];
  /** Nombre de cada clienta, para la vista de la entrenadora. */
  nombresPorCliente?: Record<string, string>;
  puedeGestionar?: boolean;
  /** Vista de la entrenadora: el día se agrupa por clienta. */
  porCliente?: boolean;
  /** Si se indica, cada sesión enlaza a `${prefijo}/${rutina_dia_id}`. */
  prefijoEjercicios?: string;
  /** Hoy según el servidor, en formato AAAA-MM-DD. */
  hoy: string;
}) {
  // El servidor puede estar en otra zona horaria que la usuaria, así que «hoy»
  // no es el mismo dato en los dos lados. `useSyncExternalStore` sirve
  // exactamente para eso: pinta la fecha del servidor al hidratar y luego usa
  // la del navegador, sin descuadres.
  const hoy = useSyncExternalStore(
    sinSuscripcion,
    fechaLocalDeHoy,
    () => hoyServidor
  );

  const [anioHoy, mesHoy, diaHoy] = hoy.split("-").map(Number);
  const [anio, setAnio] = useState(anioHoy);
  const [mes, setMes] = useState(mesHoy - 1);
  const [seleccionado, setSeleccionado] = useState<string | null>(hoy);

  const sesionesPorFecha = useMemo(
    () => agrupar(sesiones, (s) => s.fecha),
    [sesiones]
  );
  const comidasPorFecha = useMemo(
    () => agrupar(alimentacion, (a) => a.fecha),
    [alimentacion]
  );

  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = primerDiaSemana(anio, mes);
  const celdas = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const clave = (dia: number) =>
    `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const mover = (delta: number) => {
    const f = new Date(anio, mes + delta, 1);
    setAnio(f.getFullYear());
    setMes(f.getMonth());
    setSeleccionado(null);
  };

  const irAHoy = () => {
    setAnio(anioHoy);
    setMes(mesHoy - 1);
    setSeleccionado(hoy);
  };

  const sesionesDelDia = seleccionado
    ? (sesionesPorFecha.get(seleccionado) ?? [])
    : [];
  const comidasDelDia = seleccionado
    ? (comidasPorFecha.get(seleccionado) ?? [])
    : [];

  const rejilla = (
    <div
      className={cn(
        "min-w-0 rounded-4xl border border-lila-200 bg-white p-4 shadow-suave sm:p-7"
      )}
    >
      <div className="mb-7 flex items-center justify-between">
        <h2 className="text-xl font-light text-violeta-900 first-letter:uppercase">
          {MESES[mes]} {anio}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => mover(-1)}
            className="cursor-pointer rounded-full p-2 text-violeta-600 transition-colors hover:bg-lila-100"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={irAHoy}
            className="cursor-pointer rounded-full px-4 text-xs font-light text-violeta-600 transition-colors hover:bg-lila-100"
          >
            Hoy
          </button>
          <button
            onClick={() => mover(1)}
            className="cursor-pointer rounded-full p-2 text-violeta-600 transition-colors hover:bg-lila-100"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-1 sm:gap-1.5">
        {DIAS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] tracking-[0.18em] text-violeta-500 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`v${i}`} />;

          const fecha = clave(dia);
          const delDia = sesionesPorFecha.get(fecha) ?? [];
          const comidas = comidasPorFecha.get(fecha) ?? [];
          const esHoy = dia === diaHoy && mes === mesHoy - 1 && anio === anioHoy;
          const elegido = seleccionado === fecha;

          // Solo los entrenamientos: la alimentación ya no se cuenta desde
          // `sesiones` —se calcula del plan— y esas filas antiguas siguen
          // ahí. Contándolas, un día sin nada aparecía con una clienta.
          const entrenos = delDia.filter(
            (s) => s.tipo_sesion === "entrenamiento"
          );
          const hayEntreno = entrenos.length > 0;
          const hayComida = comidas.length > 0;

          // Cuántas clientas tienen algo ese día; en la vista de la
          // entrenadora es el dato que importa de un vistazo.
          const cuantas = new Set([
            ...entrenos.map((s) => s.cliente_id),
            ...comidas.map((c) => c.clienteId),
          ]).size;

          return (
            <button
              key={fecha}
              onClick={() => setSeleccionado(fecha)}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300",
                // La rejilla de la entrenadora ocupa todo el ancho, así que
                // las celdas pueden ser más altas y caber lo que hay dentro.
                porCliente
                  ? "min-h-16 py-2 text-base sm:min-h-24"
                  : "aspect-square text-sm",
                elegido
                  ? "fondo-degradado text-white shadow-suave"
                  : esHoy
                    ? "bg-lila-200 font-medium text-violeta-800"
                    : "text-violeta-900/70 hover:bg-lila-100"
              )}
            >
              {dia}

              {(hayEntreno || hayComida) && (
                <span className="flex items-center gap-0.5">
                  {hayEntreno && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        elegido ? "bg-white" : "bg-violeta-500"
                      )}
                    />
                  )}
                  {hayComida && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        elegido ? "bg-white/70" : "bg-rose-400"
                      )}
                    />
                  )}
                </span>
              )}

              {porCliente && cuantas > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-light",
                    elegido ? "text-white/80" : "text-violeta-900/45"
                  )}
                >
                  {cuantas} {cuantas === 1 ? "clienta" : "clientas"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-lila-100 pt-4 text-[11px] font-light text-violeta-900/50">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-violeta-500" />
          Entrenamiento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          Alimentación
        </span>
      </div>
    </div>
  );

  const titulo = seleccionado
    ? new Date(seleccionado + "T00:00:00").toLocaleDateString("es-DO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Selecciona un día";

  const detalle = (
    <div className="min-w-0 rounded-4xl border border-lila-200 bg-white p-4 shadow-suave sm:p-7">
      <h3 className="text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
        {titulo}
      </h3>

      {!seleccionado ? (
        <p className="mt-6 text-sm font-light text-violeta-900/45">
          Toca cualquier día del calendario para ver lo que hay.
        </p>
      ) : porCliente ? (
        <PorClienta
          sesiones={sesionesDelDia}
          comidas={comidasDelDia}
          nombres={nombresPorCliente ?? {}}
          puedeGestionar={puedeGestionar}
          prefijoEjercicios={prefijoEjercicios}
        />
      ) : (
        <MiDia
          sesiones={sesionesDelDia}
          comidas={comidasDelDia}
          puedeGestionar={puedeGestionar}
          prefijoEjercicios={prefijoEjercicios}
        />
      )}
    </div>
  );

  // `items-start`: por defecto, un grid estira ambas columnas a la altura de
  // la más alta. Sin esto, el panel de la derecha crecía al elegir un día
  // con varias sesiones y eso volvía a estirar —y a deformar— el calendario
  // de la izquierda, que no tiene nada que ver con ese contenido.
  return porCliente ? (
    <div className="space-y-5">
      {rejilla}
      {detalle}
    </div>
  ) : (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      {rejilla}
      {detalle}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* El día visto por la entrenadora: una fila por clienta               */
/* ------------------------------------------------------------------ */

function PorClienta({
  sesiones,
  comidas,
  nombres,
  puedeGestionar,
  prefijoEjercicios,
}: {
  sesiones: SesionVisible[];
  comidas: DiaDeAlimentacion[];
  nombres: Record<string, string>;
  puedeGestionar: boolean;
  prefijoEjercicios?: string;
}) {
  const clientes = useMemo(() => {
    // Solo quien tenga entrenamiento o comidas ese día: las filas antiguas
    // de tipo alimentación ya no pintan nada y colaban clientas vacías.
    const ids = new Set([
      ...sesiones
        .filter((s) => s.tipo_sesion === "entrenamiento")
        .map((s) => s.cliente_id),
      ...comidas.map((c) => c.clienteId),
    ]);
    return [...ids].sort((a, b) =>
      (nombres[a] ?? "").localeCompare(nombres[b] ?? "", "es")
    );
  }, [sesiones, comidas, nombres]);

  const [abierta, setAbierta] = useState<string | null>(null);

  if (clientes.length === 0) {
    return (
      <p className="mt-6 rounded-3xl border border-dashed border-lila-300 px-5 py-10 text-center text-sm font-light text-violeta-900/45">
        Ninguna clienta tiene nada este día.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {clientes.map((id) => {
        const suyas = sesiones.filter((s) => s.cliente_id === id);
        const suComida = comidas.filter((c) => c.clienteId === id);
        const entrenos = suyas.filter((s) => s.tipo_sesion === "entrenamiento");
        const desplegada = abierta === id;

        return (
          <li key={id} className="overflow-hidden rounded-3xl bg-lila-50">
            <button
              type="button"
              onClick={() => setAbierta(desplegada ? null : id)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-lila-100"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-violeta-800">
                  {nombres[id] ?? "Clienta"}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-light text-violeta-900/55">
                  {entrenos.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Dumbbell size={11} className="text-violeta-500" />
                      {entrenos.length === 1
                        ? "Entrenamiento"
                        : `${entrenos.length} entrenamientos`}
                    </span>
                  )}
                  {suComida.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Salad size={11} className="text-rose-400" />
                      {suComida[0].comidas.length}{" "}
                      {suComida[0].comidas.length === 1 ? "comida" : "comidas"}
                    </span>
                  )}
                  {entrenos.length === 0 && suComida.length === 0 && "Sin nada"}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  "shrink-0 text-violeta-500 transition-transform duration-300",
                  desplegada && "rotate-180"
                )}
              />
            </button>

            {desplegada && (
              <div className="border-t border-lila-200 px-5 py-4">
                <MiDia
                  sesiones={suyas}
                  comidas={suComida}
                  puedeGestionar={puedeGestionar}
                  prefijoEjercicios={prefijoEjercicios}
                  compacto
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* El día de una persona: entrenamientos y comidas                     */
/* ------------------------------------------------------------------ */

function MiDia({
  sesiones,
  comidas,
  puedeGestionar,
  prefijoEjercicios,
  compacto = false,
}: {
  sesiones: SesionVisible[];
  comidas: DiaDeAlimentacion[];
  puedeGestionar: boolean;
  prefijoEjercicios?: string;
  /** Dentro de la fila de una clienta ya hay margen por fuera. */
  compacto?: boolean;
}) {
  const entrenos = sesiones.filter((s) => s.tipo_sesion === "entrenamiento");

  if (entrenos.length === 0 && comidas.length === 0) {
    return (
      <p
        className={cn(
          "rounded-3xl border border-dashed border-lila-300 px-5 py-10 text-center text-sm font-light text-violeta-900/45",
          !compacto && "mt-6"
        )}
      >
        Nada programado este día.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", !compacto && "mt-6")}>
      {entrenos.map((s) => (
        <div key={s.id} className={cn("rounded-3xl px-5 py-4", !compacto && "bg-lila-50")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-violeta-800">
                {s.titulo}
              </p>
              <p className="mt-1 text-xs font-light text-violeta-900/55">
                {s.hora ? `${s.hora.slice(0, 5)} · ` : ""}
                {s.duracion_min} min
              </p>
            </div>
            <Insignia tono={TONO_ESTADO_SESION[s.estado]}>
              {ESTADOS_SESION[s.estado]}
            </Insignia>
          </div>

          {s.notas && (
            <p className="mt-3 text-xs leading-relaxed font-light text-violeta-900/60">
              {s.notas}
            </p>
          )}

          {prefijoEjercicios && s.rutina_dia_id && (
            <Link
              href={`${prefijoEjercicios}/${s.rutina_dia_id}`}
              className="mt-4 flex items-center gap-1.5 text-xs font-medium text-violeta-600 underline-offset-4 hover:underline"
            >
              <Dumbbell size={13} />
              Ver ejercicios
            </Link>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {s.estado !== "completada" && (
              <form action={cambiarEstadoSesion.bind(null, s.id, "completada")}>
                <button
                  type="submit"
                  className="flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <Check size={12} />
                  Completada
                </button>
              </form>
            )}
            {s.estado !== "omitida" && (
              <form action={cambiarEstadoSesion.bind(null, s.id, "omitida")}>
                <button
                  type="submit"
                  className="flex cursor-pointer items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] text-amber-700 transition-colors hover:bg-amber-100"
                >
                  <X size={12} />
                  Omitida
                </button>
              </form>
            )}
            {puedeGestionar && (
              <form action={borrarSesion.bind(null, s.id)}>
                <button
                  type="submit"
                  className="flex cursor-pointer items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <Trash2 size={12} />
                  Borrar
                </button>
              </form>
            )}
          </div>
        </div>
      ))}

      {comidas.map((dia) => (
        <div
          key={dia.planId}
          className={cn("rounded-3xl px-5 py-4", !compacto && "bg-rose-50/50")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-violeta-800">
                {dia.planNombre}
              </p>
              <p className="mt-1 text-xs font-light text-violeta-900/55">
                {dia.empieza ? "Empieza hoy · " : ""}
                {dia.comidas.length}{" "}
                {dia.comidas.length === 1 ? "comida" : "comidas"}
              </p>
            </div>
            <Insignia tono="lila">
              <Salad size={11} />
              Nutrición
            </Insignia>
          </div>

          {/* Las comidas del día, una a una: es lo que la clienta viene a
              buscar al calendario, y antes había que entrar a Nutrición y
              contar los días para saber qué tocaba hoy. */}
          <ul className="mt-4 space-y-2">
            {dia.comidas.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-rose-100 bg-white px-4 py-3"
              >
                <p className="flex items-baseline justify-between gap-2 text-xs font-medium text-violeta-800">
                  {c.nombre}
                  {c.hora && (
                    <span className="font-light text-violeta-900/45">
                      {c.hora.slice(0, 5)}
                    </span>
                  )}
                </p>
                {c.alimentos.length > 0 && (
                  <p className="mt-1 text-xs leading-relaxed font-light text-violeta-900/55">
                    {c.alimentos.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <Link
            href={
              puedeGestionar
                ? `/entrenador/dietas/${dia.planId}`
                : "/panel/alimentacion"
            }
            className="mt-4 flex items-center gap-1.5 text-xs font-medium text-violeta-600 underline-offset-4 hover:underline"
          >
            <Salad size={13} />
            Ver el plan completo
          </Link>
        </div>
      ))}
    </div>
  );
}
