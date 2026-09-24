"use client";

import {
  Copy,
  Dumbbell,
  GripVertical,
  Pencil,
  Timer,
  Trash2,
  Type,
} from "lucide-react";
import { formatearDuracion } from "@/lib/bloques";
import { cn } from "@/lib/utils";
import type { Bloque } from "@/lib/bloques";
import type { Ejercicio } from "@/lib/supabase/tipos";

function Accion({
  etiqueta,
  onClick,
  children,
  peligro = false,
}: {
  etiqueta: string;
  onClick: () => void;
  children: React.ReactNode;
  peligro?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        "cursor-pointer rounded-xl p-2 text-violeta-900/35 transition-colors",
        peligro
          ? "hover:bg-rose-100 hover:text-rose-600"
          : "hover:bg-lila-200 hover:text-violeta-700"
      )}
    >
      {children}
    </button>
  );
}

export function FilaBloque({
  bloque,
  ejercicio,
  arrastrando,
  alEditar,
  alDuplicar,
  alBorrar,
  alEmpezarArrastre,
  alSoltarEncima,
  alTerminarArrastre,
}: {
  bloque: Bloque;
  ejercicio?: Ejercicio | null;
  arrastrando: boolean;
  alEditar: () => void;
  alDuplicar: () => void;
  alBorrar: () => void;
  alEmpezarArrastre: () => void;
  alSoltarEncima: () => void;
  alTerminarArrastre: () => void;
}) {
  const esEjercicio = bloque.tipo === "ejercicio";

  return (
    <li
      draggable
      onDragStart={alEmpezarArrastre}
      onDragOver={(e) => {
        e.preventDefault();
        alSoltarEncima();
      }}
      onDragEnd={alTerminarArrastre}
      onDrop={(e) => e.preventDefault()}
      className={cn(
        "flex items-center gap-3 transition-opacity",
        arrastrando && "opacity-40"
      )}
    >
      {/* Punto de la línea de tiempo */}
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          esEjercicio ? "bg-violeta-500" : "bg-lila-300"
        )}
        aria-hidden="true"
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-3xl px-4 py-3",
          esEjercicio
            ? "border border-lila-200 bg-white"
            : bloque.tipo === "descanso"
              ? "bg-lila-100/70"
              : "bg-lila-200/60"
        )}
      >
        {esEjercicio ? (
          ejercicio?.imagen_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={ejercicio.imagen_url}
              alt=""
              className="h-11 w-11 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lila-100 text-violeta-500">
              <Dumbbell size={18} strokeWidth={1.5} />
            </span>
          )
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-violeta-500">
            {bloque.tipo === "descanso" ? <Timer size={16} /> : <Type size={15} />}
          </span>
        )}

        <div className="min-w-0 flex-1">
          {esEjercicio ? (
            <>
              <p className="truncate text-sm font-medium text-violeta-800">
                {ejercicio?.nombre ?? "Ejercicio sin definir"}
              </p>
              <p className="mt-0.5 truncate text-xs font-light text-violeta-900/55">
                {bloque.series} × {bloque.repeticiones}
                {bloque.peso_sugerido ? ` · ${bloque.peso_sugerido}` : ""}
                {` · descanso ${formatearDuracion(bloque.descanso_seg)}`}
              </p>
              {bloque.notas && (
                <p className="mt-0.5 truncate text-[11px] font-light text-violeta-900/40">
                  {bloque.notas}
                </p>
              )}
            </>
          ) : bloque.tipo === "descanso" ? (
            <p className="text-sm font-light text-violeta-900/70">
              Descanso de {formatearDuracion(bloque.descanso_seg)}
            </p>
          ) : (
            <p className="text-sm font-medium tracking-wide text-violeta-800">
              {bloque.texto}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center">
          <Accion etiqueta="Editar" onClick={alEditar}>
            <Pencil size={15} />
          </Accion>
          <Accion etiqueta="Duplicar" onClick={alDuplicar}>
            <Copy size={15} />
          </Accion>
          <Accion etiqueta="Eliminar" onClick={alBorrar} peligro>
            <Trash2 size={15} />
          </Accion>
          <span
            className="cursor-grab p-2 text-violeta-900/25 active:cursor-grabbing"
            title="Arrastra para reordenar"
          >
            <GripVertical size={15} />
          </span>
        </div>
      </div>
    </li>
  );
}
