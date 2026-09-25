"use client";

import { useState } from "react";
import { Dumbbell, Repeat, Timer, Weight } from "lucide-react";
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
    <div className="rounded-2xl bg-lila-50 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-violeta-500 uppercase">
        <Icono size={11} strokeWidth={1.8} />
        {etiqueta}
      </p>
      <p className="mt-1.5 text-sm font-medium text-violeta-800">{valor}</p>
    </div>
  );
}

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
  // esquina que la casilla «Hecho» —así que esta se aparta y vuelve sola en
  // cuanto se cierra el video.
  const [videoActivo, setVideoActivo] = useState(false);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-4xl border border-lila-200 bg-white shadow-suave",
        className
      )}
    >
      {!videoActivo && casillaHecho}
      {/* Media: el video manda; si no hay, la demostración animada; si no,
          el icono. Las tres en cuadrado para que la cuadrícula quede pareja
          —antes la imagen iba en 4/3 y rompía la fila—. */}
      {ejercicio.video_url ? (
        <VistaPreviaVideo
          url={ejercicio.video_url}
          titulo={ejercicio.nombre}
          onCambioReproduccion={setVideoActivo}
        />
      ) : ejercicio.imagen_url ? (
        <Demostracion
          url={ejercicio.imagen_url}
          titulo={ejercicio.nombre}
          onCambioReproduccion={setVideoActivo}
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-lila-100 to-lila-200">
          <Dumbbell size={40} strokeWidth={1.1} className="text-violeta-500/40" />
        </div>
      )}

      <div className="p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-violeta-500 uppercase">
              {orden != null ? `Ejercicio ${orden}` : GRUPOS[ejercicio.grupo]}
            </p>
            <h3 className="mt-1.5 text-xl font-medium text-violeta-800">
              {ejercicio.nombre}
            </h3>
            <p className="mt-1 text-xs font-light text-violeta-900/50">
              {GRUPOS[ejercicio.grupo]} · {NIVELES[ejercicio.nivel]}
              {ejercicio.equipo ? ` · ${ejercicio.equipo}` : ""}
            </p>
          </div>
        </div>

        {prescripcion && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Dato icono={Repeat} etiqueta="Series" valor={String(prescripcion.series)} />
            <Dato
              icono={Dumbbell}
              etiqueta="Reps"
              valor={prescripcion.repeticiones}
            />
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
          <p className="mt-5 rounded-2xl border border-lila-200 bg-lila-50/60 px-5 py-3 text-sm leading-relaxed font-light text-violeta-900/75">
            <span className="font-medium text-violeta-700">Nota de Yiyo: </span>
            {prescripcion.notas}
          </p>
        )}

        {ejercicio.instrucciones && (
          <div className="mt-6">
            <p className="text-[10px] tracking-[0.18em] text-violeta-500 uppercase">
              Cómo hacerlo
            </p>
            <p className="mt-2 text-sm leading-relaxed font-light text-violeta-900/75">
              {ejercicio.instrucciones}
            </p>
          </div>
        )}

        {ejercicio.consejos && (
          <div className="mt-5">
            <p className="text-[10px] tracking-[0.18em] text-violeta-500 uppercase">
              Consejos
            </p>
            <p className="mt-2 text-sm leading-relaxed font-light text-violeta-900/75">
              {ejercicio.consejos}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
