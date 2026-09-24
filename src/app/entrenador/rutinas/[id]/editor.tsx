"use client";

import { ConstructorDia } from "./constructor-dia";
import { desdeFila, type Bloque } from "@/lib/bloques";
import type { DiaConEjercicios } from "@/lib/rutinas";
import type { Ejercicio, RutinaEjercicio } from "@/lib/supabase/tipos";

/**
 * Un constructor por día. Cada uno mantiene su propia lista y se guarda por
 * separado, para no rehacer toda la rutina al tocar un solo día.
 */
export function EditorRutina({
  rutinaId,
  dias,
  bloquesPorDia,
  ejercicios,
}: {
  rutinaId: string;
  dias: DiaConEjercicios[];
  bloquesPorDia: Record<string, RutinaEjercicio[]>;
  ejercicios: Ejercicio[];
}) {
  return (
    <div className="space-y-5">
      {dias.map((dia) => {
        const iniciales: Bloque[] = (bloquesPorDia[dia.id] ?? []).map(desdeFila);
        return (
          <ConstructorDia
            key={dia.id}
            diaId={dia.id}
            rutinaId={rutinaId}
            nombreDia={`Día ${dia.numero} · ${dia.nombre}`}
            bloquesIniciales={iniciales}
            ejercicios={ejercicios}
          />
        );
      })}
    </div>
  );
}
