"use client";

import { useState } from "react";
import { ChevronDown, Dumbbell, Repeat, Timer, Weight } from "lucide-react";
import { VistaPreviaVideo } from "./video-ejercicio";
import { Demostracion } from "./demostracion-ejercicio";
import { GRUPOS, NIVELES } from "@/lib/etiquetas";
import { cn } from "@/lib/utils";
import type { Ejercicio, RutinaEjercicio } from "@/lib/supabase/tipos";

function Dato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: React.ElementType;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="min-w-0 border border-violeta-900/15 bg-lila-50 px-2 py-2 sm:px-3">
      <p className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.06em] text-violeta-600 uppercase sm:text-[10px] sm:tracking-[0.12em]">
        <Icono size={10} strokeWidth={2} className="hidden shrink-0 sm:block" />
        <span className="truncate">{etiqueta}</span>
      </p>
      <p className="mt-1 text-[13px] leading-tight font-semibold break-words text-violeta-900 sm:text-sm">
        {valor}
      </p>
    </div>
  );
}

/**
 * Tarjeta de un ejercicio dentro de la sesión de la clienta.
 *
 * Pensada para verse entera sin hacer scroll: en el teléfono la imagen ocupa
 * un tercio de la altura de la pantalla (no un cuadrado del ancho completo) y
 * en tableta y escritorio pasa a dos columnas —demostración a la izquierda,
 * datos a la derecha—. Las instrucciones y los consejos van plegados: quien
 * los necesita los abre, y el resto no paga con altura.
 */
export function TarjetaEjercicio({
  ejercicio,
  prescripcion,
  orden,
  className,
  casillaHecho,
}: {
  ejercicio: Ejercicio;
  prescripcion?: RutinaEjercicio;
  orden?: number;
  className?: string;
  /** El botón «Hecho», si esta tarjeta se ve desde el día de la clienta. */
  casillaHecho?: React.ReactNode;
}) {
  // Mientras el video está reproduciéndose, su «X» de cerrar ocupa la misma
  // esquina que la casilla «Hecho» en el teléfono —así que esta se aparta y
  // vuelve sola en cuanto se cierra el video.
  const [videoActivo, setVideoActivo] = useState(false);
  const [detalle, setDetalle] = useState(false);
  const hayDetalle = Boolean(ejercicio.instrucciones || ejercicio.consejos);

  return (
    <article
      className={cn(
        "relative overflow-hidden border border-violeta-900/25 bg-white shadow-suave md:grid md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]",
        className
      )}
    >
      {!videoActivo && casillaHecho}

      {/* Media: el video manda; si no hay, la demostración animada; si no,
          el icono. Altura fija relativa a la pantalla en el teléfono y
          cuadrada en tableta y escritorio. */}
      <div className="relative h-[30dvh] max-h-72 min-h-40 border-b border-violeta-900/15 bg-white md:h-auto md:max-h-none md:min-h-0 md:aspect-square md:border-r md:border-b-0">
        {ejercicio.video_url ? (
          <VistaPreviaVideo
            url={ejercicio.video_url}
            titulo={ejercicio.nombre}
            onCambioReproduccion={setVideoActivo}
            className="h-full aspect-auto"
          />
        ) : ejercicio.imagen_url ? (
          <Demostracion
            url={ejercicio.imagen_url}
            titulo={ejercicio.nombre}
            onCambioReproduccion={setVideoActivo}
            className="h-full aspect-auto"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-lila-100">
            <Dumbbell size={36} strokeWidth={1.2} className="text-violeta-500/40" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-4 md:p-5">
        <div className="min-w-0 md:pr-24">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-violeta-600 uppercase">
            {orden != null ? `Ejercicio ${orden}` : GRUPOS[ejercicio.grupo]}
          </p>
          <h3 className="mt-0.5 text-lg leading-tight font-bold break-words text-violeta-900 sm:text-xl">
            {ejercicio.nombre}
          </h3>
          <p className="mt-0.5 text-xs break-words text-violeta-900/60">
            {GRUPOS[ejercicio.grupo]} · {NIVELES[ejercicio.nivel]}
            {ejercicio.equipo ? ` · ${ejercicio.equipo}` : ""}
          </p>
        </div>

        {prescripcion && (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <Dato icono={Repeat} etiqueta="Series" valor={String(prescripcion.series)} />
            <Dato icono={Dumbbell} etiqueta="Reps" valor={prescripcion.repeticiones} />
            <Dato
              icono={Timer}
              etiqueta="Descanso"
              valor={`${prescripcion.descanso_seg}s`}
            />
            <Dato
              icono={Weight}
              etiqueta="Peso"
              valor={prescripcion.peso_sugerido || "A tu ritmo"}
            />
          </div>
        )}

        {prescripcion?.notas && (
          <p className="line-clamp-2 border-l-2 border-violeta-600 bg-lila-50 px-3 py-2 text-[13px] leading-snug break-words text-violeta-900/80">
            <span className="font-semibold text-violeta-800">Nota de Yiyo: </span>
            {prescripcion.notas}
          </p>
        )}

        {hayDetalle && (
          <div className="border-t border-violeta-900/15 pt-2">
            <button
              type="button"
              onClick={() => setDetalle((v) => !v)}
              aria-expanded={detalle}
              className="flex w-full cursor-pointer items-center justify-between gap-2 py-1 text-xs font-semibold tracking-[0.12em] text-violeta-700 uppercase transition-colors hover:text-violeta-900"
            >
              Cómo hacerlo y consejos
              <ChevronDown
                size={16}
                className={cn("shrink-0 transition-transform duration-200", detalle && "rotate-180")}
              />
            </button>
            {detalle && (
              <div className="mt-2 space-y-3 text-sm leading-relaxed break-words text-violeta-900/80">
                {ejercicio.instrucciones && (
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-violeta-600 uppercase">
                      Cómo hacerlo
                    </p>
                    <p className="mt-1">{ejercicio.instrucciones}</p>
                  </div>
                )}
                {ejercicio.consejos && (
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-violeta-600 uppercase">
                      Consejos
                    </p>
                    <p className="mt-1">{ejercicio.consejos}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
