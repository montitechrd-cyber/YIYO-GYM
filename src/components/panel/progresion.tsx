import { Info } from "lucide-react";
import {
  CICLO,
  REGLA_DE_CARGA,
  SEMANAS_POR_CICLO,
  progresionDe,
} from "@/lib/progresion";
import { cn } from "@/lib/utils";

/**
 * En qué semana del ciclo va la rutina y qué toca hacer esta semana.
 *
 * Se muestra igual a la clienta que a la entrenadora; lo único que cambia es
 * que a la entrenadora se le añade el detalle y la regla para subir carga.
 */
export function TarjetaProgresion({
  fechaInicio,
  detallada = false,
  className,
}: {
  fechaInicio: string | null | undefined;
  detallada?: boolean;
  className?: string;
}) {
  const estado = progresionDe(fechaInicio);
  if (!estado) return null;

  const { semana, ciclo, fase } = estado;

  return (
    <section
      className={cn(
        "rounded-4xl border border-lila-200 bg-white p-7 shadow-suave",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-violeta-500 uppercase">
            Semana {semana} de {SEMANAS_POR_CICLO}
            {ciclo > 1 && ` · ciclo ${ciclo}`}
          </p>
          <h3 className="mt-1.5 flex items-center gap-2 text-xl font-medium text-violeta-800">
            <span aria-hidden>{fase.emoji}</span>
            {fase.titulo}
          </h3>
          <p className="mt-1 text-sm font-light text-violeta-900/65">
            {fase.indicacion}
          </p>
        </div>
      </div>

      {/* Las seis semanas del ciclo, con la actual marcada. */}
      <ol className="mt-6 flex gap-1.5" aria-label="Ciclo de progresión">
        {CICLO.map((f) => {
          const pasada = f.semana < semana;
          const actual = f.semana === semana;
          return (
            <li
              key={f.semana}
              title={`Semana ${f.semana} — ${f.titulo}`}
              aria-current={actual ? "step" : undefined}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                actual
                  ? "fondo-degradado"
                  : pasada
                    ? "bg-lila-400"
                    : "bg-lila-100"
              )}
            />
          );
        })}
      </ol>

      {detallada && (
        <div className="mt-6 space-y-3 border-t border-lila-100 pt-5">
          <p className="text-xs leading-relaxed font-light text-violeta-900/70">
            {fase.detalle}
          </p>
          <p className="flex gap-2.5 rounded-2xl bg-lila-50 px-5 py-3 text-xs leading-relaxed font-light text-violeta-900/70">
            <Info size={14} className="mt-0.5 shrink-0 text-lila-400" />
            {REGLA_DE_CARGA}
          </p>
        </div>
      )}
    </section>
  );
}
