"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, ChevronLeft, ChevronRight, Dumbbell, Salad, Trash2, X } from "lucide-react";
import {
  borrarSesion,
  cambiarEstadoSesion,
} from "@/app/entrenador/calendario/acciones";
import { ESTADOS_SESION, TONO_ESTADO_SESION } from "@/lib/etiquetas";
import { Insignia } from "@/components/panel/piezas";
import { cn } from "@/lib/utils";
import type { Sesion } from "@/lib/supabase/tipos";

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

export function Calendario({
  sesiones,
  puedeGestionar = false,
  prefijoEjercicios,
  hoy: hoyServidor,
}: {
  sesiones: SesionVisible[];
  puedeGestionar?: boolean;
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
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  const porFecha = useMemo(() => {
    const mapa = new Map<string, SesionVisible[]>();
    sesiones.forEach((s) => {
      const lista = mapa.get(s.fecha) ?? [];
      lista.push(s);
      mapa.set(s.fecha, lista);
    });
    return mapa;
  }, [sesiones]);

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

  const sesionesDelDia = seleccionado ? (porFecha.get(seleccionado) ?? []) : [];

  return (
    // `items-start`: por defecto, un grid estira ambas columnas a la altura de
    // la más alta. Sin esto, el panel de la derecha crecía al elegir un día
    // con varias sesiones y eso volvía a estirar —y a deformar— el calendario
    // de la izquierda, que no tiene nada que ver con ese contenido.
    <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-4xl border border-lila-200 bg-white p-4 shadow-suave sm:p-7">
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
            const delDia = porFecha.get(fecha) ?? [];
            const esHoy = dia === diaHoy && mes === mesHoy - 1 && anio === anioHoy;

            return (
              <button
                key={fecha}
                onClick={() => setSeleccionado(fecha)}
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl text-sm transition-all duration-300",
                  seleccionado === fecha
                    ? "fondo-degradado text-white shadow-suave"
                    : esHoy
                      ? "bg-lila-200 font-medium text-violeta-800"
                      : "text-violeta-900/70 hover:bg-lila-100"
                )}
              >
                {dia}
                {delDia.length > 0 && (
                  <span className="flex gap-0.5">
                    {delDia.slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          seleccionado === fecha
                            ? "bg-white"
                            : s.tipo_sesion === "alimentacion"
                              ? "bg-rose-400"
                              : s.estado === "completada"
                                ? "bg-emerald-500"
                                : "bg-violeta-500"
                        )}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-4xl border border-lila-200 bg-white p-4 shadow-suave sm:p-7">
        <h3 className="text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
          {seleccionado
            ? new Date(seleccionado + "T00:00:00").toLocaleDateString("es-DO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : "Selecciona un día"}
        </h3>

        {seleccionado ? (
          sesionesDelDia.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {sesionesDelDia.map((s) => (
                <li key={s.id} className="rounded-3xl bg-lila-50 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-violeta-800">
                        {s.titulo}
                      </p>
                      <p className="mt-1 text-xs font-light text-violeta-900/55">
                        {s.nombreCliente ? `${s.nombreCliente} · ` : ""}
                        {s.tipo_sesion === "alimentacion"
                          ? "Plan de alimentación"
                          : `${s.hora ? `${s.hora.slice(0, 5)} · ` : ""}${s.duracion_min} min`}
                      </p>
                    </div>
                    {s.tipo_sesion === "alimentacion" ? (
                      <Insignia tono="lila">
                        <Salad size={11} />
                        Nutrición
                      </Insignia>
                    ) : (
                      <Insignia tono={TONO_ESTADO_SESION[s.estado]}>
                        {ESTADOS_SESION[s.estado]}
                      </Insignia>
                    )}
                  </div>

                  {s.notas && (
                    <p className="mt-3 text-xs leading-relaxed font-light text-violeta-900/60">
                      {s.notas}
                    </p>
                  )}

                  {s.tipo_sesion === "alimentacion" ? (
                    <Link
                      href={
                        puedeGestionar
                          ? `/entrenador/dietas/${s.plan_alimentacion_id}`
                          : "/panel/alimentacion"
                      }
                      className="mt-4 flex items-center gap-1.5 text-xs font-medium text-violeta-600 underline-offset-4 hover:underline"
                    >
                      <Salad size={13} />
                      Ver el plan de alimentación
                    </Link>
                  ) : (
                    prefijoEjercicios &&
                    s.rutina_dia_id && (
                      <Link
                        href={`${prefijoEjercicios}/${s.rutina_dia_id}`}
                        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-violeta-600 underline-offset-4 hover:underline"
                      >
                        <Dumbbell size={13} />
                        Ver ejercicios y videos
                      </Link>
                    )
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.tipo_sesion === "entrenamiento" && s.estado !== "completada" && (
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
                    {s.tipo_sesion === "entrenamiento" && s.estado !== "omitida" && (
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-3xl border border-dashed border-lila-300 px-5 py-10 text-center text-sm font-light text-violeta-900/45">
              Sin sesiones este día.
            </p>
          )
        ) : (
          <p className="mt-6 text-sm font-light text-violeta-900/45">
            Toca cualquier día del calendario para ver o gestionar sus sesiones.
          </p>
        )}
      </div>
    </div>
  );
}
