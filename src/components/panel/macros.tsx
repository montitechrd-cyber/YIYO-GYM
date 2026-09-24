import { porcentaje, redondear, type Macros } from "@/lib/nutricion";
import { cn } from "@/lib/utils";

type Objetivos = {
  calorias?: number | null;
  proteina?: number | null;
  carbohidratos?: number | null;
  grasa?: number | null;
};

const BARRAS = [
  { clave: "proteina", etiqueta: "Proteína", color: "bg-violeta-500" },
  { clave: "carbohidratos", etiqueta: "Carbos", color: "bg-lila-400" },
  { clave: "grasa", etiqueta: "Grasa", color: "bg-rosa" },
] as const;

/** Diferencia respecto al objetivo, con el signo delante. */
function diferencia(actual: number, objetivo?: number | null) {
  if (!objetivo) return null;
  const d = Math.round(actual - objetivo);
  if (d === 0) return "justo en el objetivo";
  return `${d > 0 ? "+" : ""}${d} respecto al objetivo`;
}

export function ResumenMacros({
  macros,
  objetivos,
  compacto = false,
  className,
}: {
  macros: Macros;
  objetivos?: Objetivos;
  compacto?: boolean;
  className?: string;
}) {
  const m = redondear(macros);
  const pctCalorias = porcentaje(m.calorias, objetivos?.calorias);

  if (compacto) {
    return (
      <p
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-light text-violeta-900/60",
          className
        )}
      >
        <span className="font-medium text-violeta-700">{m.calorias} kcal</span>
        <span>P {m.proteina} g</span>
        <span>C {m.carbohidratos} g</span>
        <span>G {m.grasa} g</span>
      </p>
    );
  }

  return (
    <div className={cn("rounded-4xl bg-lila-50 p-6", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-violeta-500 uppercase">
            Calorías
          </p>
          <p className="mt-1 text-3xl font-light text-violeta-800">
            {m.calorias}
            {objetivos?.calorias ? (
              <span className="ml-1 text-base text-violeta-900/40">
                / {objetivos.calorias} kcal
              </span>
            ) : (
              <span className="ml-1 text-base text-violeta-900/40">kcal</span>
            )}
          </p>
        </div>
        {objetivos?.calorias && (
          <p className="text-xs font-light text-violeta-900/55">
            {diferencia(m.calorias, objetivos.calorias)}
          </p>
        )}
      </div>

      {objetivos?.calorias && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-lila-200">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              pctCalorias > 110 ? "bg-amber-400" : "fondo-degradado"
            )}
            style={{ width: `${Math.min(pctCalorias, 100)}%` }}
          />
        </div>
      )}

      <dl className="mt-6 grid grid-cols-3 gap-4">
        {BARRAS.map((b) => {
          const valor = m[b.clave];
          const objetivo = objetivos?.[b.clave];
          const pct = porcentaje(valor, objetivo);
          return (
            <div key={b.clave}>
              <dt className="text-[10px] tracking-[0.16em] text-violeta-500 uppercase">
                {b.etiqueta}
              </dt>
              <dd className="mt-1 text-lg font-light text-violeta-800">
                {valor}
                <span className="text-xs text-violeta-900/40">
                  {objetivo ? ` / ${objetivo} g` : " g"}
                </span>
              </dd>
              {objetivo ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-lila-200">
                  <div
                    className={cn("h-full rounded-full", b.color)}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </dl>

      {m.fibra > 0 && (
        <p className="mt-4 text-[11px] font-light text-violeta-900/45">
          Fibra: {m.fibra} g
        </p>
      )}
    </div>
  );
}
