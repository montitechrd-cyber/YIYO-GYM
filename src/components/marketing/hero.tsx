import { ArrowRight } from "lucide-react";
import { BotonEnlace } from "@/components/ui/boton";
import { Isotipo } from "@/components/brand/logo";

/**
 * Portada de la plataforma.
 *
 * En móvil, la foto conserva su composición inmersiva con texto superpuesto.
 * En escritorio, un marco rectangular amplio da protagonismo al retrato
 * junto al texto, sin extender la foto a todo el ancho de la pantalla.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[94svh] flex-col justify-end overflow-hidden lg:min-h-[min(820px,max(700px,94svh))] lg:justify-center lg:bg-crema">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_85%_45%,var(--color-lila-200),transparent_65%)] lg:block" />
      {/* Dos archivos: el teléfono no descarga la versión grande. En una
          portada, que es lo primero que se pinta, ese peso se nota. */}
      <picture className="lg:absolute lg:top-28 lg:right-[max(2rem,calc((100vw-1152px)/2+24px))] lg:bottom-8 lg:w-[42%] lg:max-w-[500px]">
        <source media="(min-width: 768px)" srcSet="/yiyo-portada.webp" />
        <img
          src="/yiyo-portada-movil.webp"
          alt="Daniela «Yiyo» Chacón entrenando en el gimnasio"
          fetchPriority="high"
          width={820}
          height={1364}
          className="absolute inset-0 h-full w-full object-cover object-[54%_20%] lg:rounded-xl lg:object-[54%_40%] lg:shadow-elevada"
        />
      </picture>

      {/* Velo superior: deja legible la barra de navegación. */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-lila-100 via-lila-100/55 to-transparent lg:hidden" />

      {/* Velo inferior: suficiente para que el titular tenga contraste, no
          tanto como para tapar la foto. El resto lo aporta la sombra del
          propio texto. */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-violeta-900/95 via-violeta-900/55 to-transparent lg:hidden" />

      {/* Un tinte de marca sobre la foto, para que el morado no viva solo
          en los textos. */}
      <div className="absolute inset-0 bg-gradient-to-br from-violeta-700/20 via-transparent to-violeta-900/20 lg:hidden" />

      <Isotipo
        className="pointer-events-none absolute right-[43%] bottom-12 hidden h-24 text-violeta-700 opacity-[0.08] lg:block"
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-14 sm:pb-16 lg:pointer-events-none lg:pt-32 lg:pb-16">
        <div className="animate-aparecer max-w-xl lg:pointer-events-auto lg:max-w-[50%]">
          <p className="mb-6 hidden items-center gap-3 text-[11px] font-medium tracking-[0.24em] text-violeta-700 uppercase lg:flex">
            <span aria-hidden="true" className="h-px w-9 bg-violeta-500" />
            Entrenamiento · Nutrición · Hábitos
          </p>
          <h1 className="text-6xl leading-[0.95] font-light tracking-tight text-white [text-shadow:0_2px_24px_rgb(63_26_107_/_0.55)] sm:text-7xl lg:text-[clamp(4.5rem,6.5vw,5.75rem)] lg:text-violeta-900 lg:[text-shadow:none]">
            Fuerza que
            <span className="font-script mt-1 block text-[1.15em] leading-[1] text-lila-200 lg:text-violeta-600">
              transforma
            </span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-relaxed font-light text-white/90 [text-shadow:0_1px_12px_rgb(63_26_107_/_0.6)] lg:max-w-[25rem] lg:leading-7 lg:text-violeta-900/75 lg:[text-shadow:none]">
            Soy{" "}
            <strong className="font-medium text-white lg:text-violeta-900">
              Daniela «Yiyo» Chacón
            </strong>
            , entrenadora personal y coach fitness. Te acompaño con
            entrenamiento, nutrición y hábitos hechos para tu cuerpo y tu vida
            real.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:flex-wrap">
            <BotonEnlace href="/registro" tamano="lg" className="group">
              Empezar mi transformación
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </BotonEnlace>
            <a
              href="#metodo"
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-7 py-4 text-sm font-medium text-white backdrop-blur transition-colors duration-300 hover:border-white/70 hover:bg-white/10 lg:border-lila-300 lg:text-violeta-800 lg:backdrop-blur-none lg:hover:border-violeta-500 lg:hover:bg-lila-100"
            >
              Conocer el método
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
