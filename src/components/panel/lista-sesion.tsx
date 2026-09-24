import { Layers, Timer } from "lucide-react";
import { TarjetaEjercicio } from "./tarjeta-ejercicio";
import { CasillaHecho } from "./casilla-hecho";
import { formatearDuracion } from "@/lib/bloques";
import type { Ejercicio, RutinaEjercicio } from "@/lib/supabase/tipos";

type Tramo = {
  grupo: number | null;
  veces: number;
  bloques: RutinaEjercicio[];
};

/** Agrupa los bloques consecutivos que pertenecen al mismo circuito. */
function porTramos(bloques: RutinaEjercicio[]): Tramo[] {
  const salida: Tramo[] = [];
  for (const b of bloques) {
    const ultimo = salida.at(-1);
    if (ultimo && ultimo.grupo != null && ultimo.grupo === (b.grupo ?? null)) {
      ultimo.bloques.push(b);
    } else {
      salida.push({
        grupo: b.grupo ?? null,
        veces: b.grupo_repeticiones ?? 1,
        bloques: [b],
      });
    }
  }
  return salida;
}

function Bloque({
  bloque,
  ejercicio,
  numero,
  diaId,
  hecho,
}: {
  bloque: RutinaEjercicio;
  ejercicio?: Ejercicio | null;
  numero?: number;
  /** Si se indica, cada ejercicio lleva su botón «Hecho». */
  diaId?: string;
  hecho?: boolean;
}) {
  const tipo = bloque.tipo ?? "ejercicio";

  if (tipo === "etiqueta") {
    return (
      <p className="pt-3 text-[11px] tracking-[0.24em] text-violeta-500 uppercase">
        {bloque.texto}
      </p>
    );
  }

  if (tipo === "descanso") {
    return (
      <p className="flex items-center gap-2.5 rounded-3xl bg-lila-100/70 px-5 py-3 text-sm font-light text-violeta-900/70">
        <Timer size={15} className="text-violeta-500" />
        Descansa {formatearDuracion(bloque.descanso_seg)}
      </p>
    );
  }

  if (!ejercicio) return null;

  return (
    <TarjetaEjercicio
      ejercicio={ejercicio}
      prescripcion={bloque}
      orden={numero}
      casillaHecho={
        diaId && (
          <CasillaHecho diaId={diaId} ejercicioId={ejercicio.id} hecho={hecho ?? false} />
        )
      }
    />
  );
}

/**
 * La sesión tal como la ve la clienta: la misma secuencia que armó la
 * entrenadora, con sus descansos, sus títulos y sus circuitos.
 *
 * Si se pasa `diaId`, cada ejercicio lleva un botón «Hecho» que marca el
 * avance de hoy; `completadosHoy` trae cuáles ya están marcados.
 */
export function ListaSesion({
  bloques,
  ejercicios,
  diaId,
  completadosHoy,
}: {
  bloques: RutinaEjercicio[];
  ejercicios: Map<string, Ejercicio>;
  diaId?: string;
  completadosHoy?: Set<string>;
}) {
  let contador = 0;

  return (
    <div className="space-y-4">
      {porTramos(bloques).map((tramo, i) => {
        const contenido = tramo.bloques.map((b) => {
          if ((b.tipo ?? "ejercicio") === "ejercicio") contador++;
          return (
            <Bloque
              key={b.id}
              bloque={b}
              ejercicio={b.ejercicio_id ? ejercicios.get(b.ejercicio_id) : null}
              numero={(b.tipo ?? "ejercicio") === "ejercicio" ? contador : undefined}
              diaId={diaId}
              hecho={b.ejercicio_id ? completadosHoy?.has(b.ejercicio_id) : false}
            />
          );
        });

        if (tramo.grupo == null) {
          return (
            <div key={`suelto-${i}`} className="space-y-4">
              {contenido}
            </div>
          );
        }

        return (
          <section
            key={`circuito-${tramo.grupo}`}
            className="rounded-4xl border-2 border-dashed border-violeta-500/35 bg-lila-50/50 p-5"
          >
            <p className="mb-4 flex items-center gap-2 text-[11px] tracking-[0.2em] text-violeta-600 uppercase">
              <Layers size={13} />
              Circuito · repite {tramo.veces} veces
            </p>
            <div className="space-y-4">{contenido}</div>
          </section>
        );
      })}
    </div>
  );
}
