import { Check } from "lucide-react";
import { BotonEnlace } from "@/components/ui/boton";
import { cn } from "@/lib/utils";

const planes = [
  {
    nombre: "Esencial",
    resumen: "Para empezar con estructura y sin excusas.",
    beneficios: [
      "Rutina de entrenamiento mensual",
      "Biblioteca de ejercicios en video",
      "Registro de entrenamientos",
      "Seguimiento de peso y medidas",
    ],
    destacado: false,
  },
  {
    nombre: "Transformación",
    resumen: "El plan completo: entrenamiento + nutrición + acompañamiento.",
    beneficios: [
      "Todo lo del plan Esencial",
      "Plan de nutrición personalizado",
      "Ajustes cada 2 semanas",
      "Chat directo con Yiyo",
      "Fotos de progreso comparativas",
    ],
    destacado: true,
  },
  {
    nombre: "Élite",
    resumen: "Acompañamiento uno a uno, máxima cercanía.",
    beneficios: [
      "Todo lo del plan Transformación",
      "2 videollamadas al mes",
      "Revisión semanal de técnica",
      "Plan de suplementación",
      "Prioridad en respuestas",
    ],
    destacado: false,
  },
];

export function Planes() {
  return (
    <section id="planes" className="bg-crema py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-3xl text-[clamp(2.75rem,12vw,6rem)] break-words text-violeta-900">
            Elige cómo quieres que te acompañe
          </h2>
          <p className="max-w-sm text-base leading-7 text-violeta-900/80">
            Sin permanencia. Cancela cuando quieras desde tu propio panel. Los
            precios se muestran al crear tu cuenta.
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 items-stretch gap-0 border-2 border-violeta-900 lg:grid-cols-3">
          {planes.map((p) => (
            <article
              key={p.nombre}
              className={cn(
                "flex min-w-0 flex-col p-5 sm:p-8 md:p-10",
                "border-b-2 border-violeta-900 last:border-b-0 lg:border-r-2 lg:border-b-0 lg:last:border-r-0",
                p.destacado ? "bg-violeta-700 text-white" : "bg-white text-violeta-900"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-[clamp(2.25rem,10vw,3rem)] uppercase">{p.nombre}</h3>
                {p.destacado && (
                  <span className="shrink-0 bg-crema px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-violeta-900 uppercase">
                    Más elegido
                  </span>
                )}
              </div>

              <p
                className={cn(
                  "mt-5 text-[15px] leading-6",
                  p.destacado ? "text-white/90" : "text-violeta-900/75"
                )}
              >
                {p.resumen}
              </p>

              <ul
                className={cn(
                  "mt-8 flex-1 border-t",
                  p.destacado ? "border-white/40" : "border-violeta-900/25"
                )}
              >
                {p.beneficios.map((b) => (
                  <li
                    key={b}
                    className={cn(
                      "flex items-start gap-3 border-b py-3 text-sm",
                      p.destacado ? "border-white/20" : "border-violeta-900/15"
                    )}
                  >
                    <Check
                      size={16}
                      strokeWidth={3}
                      className={cn("mt-0.5 shrink-0", p.destacado ? "text-lila-200" : "text-violeta-700")}
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <BotonEnlace
                href="/registro"
                variante={p.destacado ? "claro" : "contorno"}
                className="mt-9 w-full"
              >
                Elegir {p.nombre}
              </BotonEnlace>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
