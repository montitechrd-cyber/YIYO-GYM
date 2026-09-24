import { Check } from "lucide-react";
import { BotonEnlace } from "@/components/ui/boton";
import { Separador } from "@/components/brand/decoraciones";
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
    <section id="planes" className="relative bg-crema py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-[11px] tracking-[0.28em] text-violeta-500 uppercase">
            Planes
          </p>
          <h2 className="mt-4 text-4xl font-light text-violeta-900 md:text-5xl">
            Elige cómo quieres que te acompañe
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-light text-violeta-900/65">
            Sin permanencia. Cancela cuando quieras desde tu propio panel. Los
            precios se muestran al crear tu cuenta.
          </p>
          <Separador className="mt-8" />
        </div>

        <div className="mt-16 grid items-start gap-6 lg:grid-cols-3">
          {planes.map((p) => (
            <article
              key={p.nombre}
              className={cn(
                "relative overflow-hidden rounded-4xl p-9 transition-all duration-500",
                p.destacado
                  ? "fondo-degradado text-white shadow-elevada lg:-translate-y-4 lg:scale-[1.03]"
                  : "border border-lila-200 bg-white text-violeta-900 hover:-translate-y-1.5 hover:border-lila-400 hover:shadow-suave"
              )}
            >
              {p.destacado && (
                <span className="absolute top-7 right-7 rounded-full bg-white/20 px-3 py-1 text-[10px] tracking-[0.18em] text-white uppercase backdrop-blur">
                  Más elegido
                </span>
              )}

              <h3
                className={cn(
                  "text-sm tracking-[0.22em] uppercase",
                  p.destacado ? "text-lila-100" : "text-violeta-500"
                )}
              >
                {p.nombre}
              </h3>

              <p
                className={cn(
                  "mt-6 text-sm leading-relaxed font-light",
                  p.destacado ? "text-lila-100/85" : "text-violeta-900/60"
                )}
              >
                {p.resumen}
              </p>

              <ul className="mt-8 space-y-3.5">
                {p.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm font-light">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        p.destacado
                          ? "bg-white/20 text-white"
                          : "bg-lila-100 text-violeta-600"
                      )}
                    >
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span className={p.destacado ? "text-lila-50" : "text-violeta-900/75"}>
                      {b}
                    </span>
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
