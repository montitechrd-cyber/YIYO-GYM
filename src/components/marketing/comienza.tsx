import { ArrowRight } from "lucide-react";
import { BotonEnlace } from "@/components/ui/boton";

const PASOS = [
  {
    numero: "1",
    titulo: "Crea tu cuenta",
    detalle: "Gratis, sin tarjeta. Un minuto y ya tienes tu espacio.",
  },
  {
    numero: "2",
    titulo: "Cuéntanos de ti",
    detalle:
      "Tu evaluación inicial: objetivo, salud, hábitos. Las medidas te las tomo yo, en persona.",
  },
  {
    numero: "3",
    titulo: "Recibe tu plan",
    detalle: "Rutina y alimentación a tu medida, listas en tu calendario.",
  },
];

const BENEFICIOS = [
  "Evaluación 100% personalizada, no una plantilla",
  "Acompañamiento real de Yiyo, no un algoritmo",
  "Cancela cuando quieras, sin permanencia",
];

/**
 * La sección de conversión del landing: el paso de "solo mirando" a
 * "tengo cuenta y ya envié mi evaluación".
 */
export function Comienza() {
  return (
    <section id="empieza" className="bg-violeta-900 py-14 text-white sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="max-w-4xl text-[clamp(2.75rem,12vw,6rem)] break-words">
          Tu transformación empieza con{" "}
          <span className="text-lila-300">tres pasos</span>
        </h2>
        <p className="mt-6 max-w-lg text-base leading-7 text-white/85">
          Crea tu cuenta, cuéntame de ti y en menos de 48 horas tienes tu rutina
          y tu alimentación listas para empezar.
        </p>

        <ol className="mt-10 sm:mt-14 grid grid-cols-1 border-t border-white/50 md:grid-cols-3">
          {PASOS.map((p) => (
            <li
              key={p.numero}
              className="border-b border-white/25 py-8 md:border-r md:border-b-0 md:px-6 md:first:pl-0 md:last:border-r-0"
            >
              <span className="cifra block text-[clamp(4.5rem,24vw,6rem)] text-lila-300">{p.numero}</span>
              <h3 className="mt-3 text-3xl uppercase">{p.titulo}</h3>
              <p className="mt-3 max-w-xs text-[15px] leading-6 text-white/80">{p.detalle}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-col gap-10 border-t border-white/50 pt-10 lg:flex-row lg:items-center lg:justify-between">
          <ul className="space-y-2 text-sm text-white/90">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-lila-300" />
                {b}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <BotonEnlace href="/registro" variante="claro" tamano="lg" className="group">
              Crear mi cuenta gratis
              <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
            </BotonEnlace>
            <BotonEnlace
              href="/entrar"
              tamano="lg"
              variante="fantasma"
              className="border-white/60 text-white hover:bg-white hover:text-violeta-900"
            >
              Ya tengo cuenta
            </BotonEnlace>
          </div>
        </div>
      </div>
    </section>
  );
}
