import { ArrowRight } from "lucide-react";
import { BotonEnlace } from "@/components/ui/boton";

const PILARES = ["Entrenamiento", "Nutrición", "Hábitos"];

/**
 * Portada: titular de cartel junto al retrato, y una tira de tres pilares
 * que cierra el primer pantallazo como el pie de una portada de revista.
 */
export function Hero() {
  return (
    <section className="relative bg-crema pt-24 lg:pt-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div className="animate-aparecer flex flex-col justify-center py-4 lg:py-10">
          <h1 className="text-[clamp(4.25rem,15vw,6rem)] text-violeta-900">
            Fuerza que
            <span className="block text-violeta-600">transforma</span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-7 text-violeta-900/80">
            Soy <strong className="font-semibold text-violeta-900">Daniela «Yiyo» Chacón</strong>,
            entrenadora personal y coach fitness. Te acompaño con
            entrenamiento, nutrición y hábitos hechos para tu cuerpo y tu vida
            real.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <BotonEnlace href="/registro" tamano="lg" className="group">
              Empezar mi transformación
              <ArrowRight
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </BotonEnlace>
            <BotonEnlace href="#metodo" variante="contorno" tamano="lg">
              Conocer el método
            </BotonEnlace>
          </div>
        </div>

        {/* Dos archivos: el teléfono no descarga la versión grande. */}
        <div className="relative lg:pb-10">
          <div
            aria-hidden="true"
            className="absolute -right-3 -bottom-3 left-3 hidden h-full bg-violeta-700 lg:block"
          />
          <picture className="relative block aspect-[4/5] overflow-hidden border border-violeta-900 lg:aspect-auto lg:h-full lg:min-h-[560px]">
            <source media="(min-width: 768px)" srcSet="/yiyo-portada.webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/yiyo-portada-movil.webp"
              alt="Daniela «Yiyo» Chacón entrenando en el gimnasio"
              fetchPriority="high"
              width={820}
              height={1364}
              className="absolute inset-0 h-full w-full object-cover object-[54%_22%]"
            />
          </picture>
        </div>
      </div>

      <ul className="mt-12 grid grid-cols-3 border-y-2 border-violeta-900 bg-violeta-900 text-white">
        {PILARES.map((p, i) => (
          <li
            key={p}
            className={`px-4 py-4 text-center font-display text-lg font-extrabold uppercase tracking-[0.04em] [font-stretch:72%] sm:text-2xl ${
              i < PILARES.length - 1 ? "border-r border-white/25" : ""
            }`}
          >
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}
