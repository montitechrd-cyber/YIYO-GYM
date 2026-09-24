import { ArrowRight } from "lucide-react";
import { BotonEnlace } from "@/components/ui/boton";
import { Isotipo } from "@/components/brand/logo";

/**
 * Portada de la plataforma.
 *
 * La foto de Yiyo ocupa toda la pantalla y es lo primero que se ve, en el
 * teléfono igual que en el escritorio. Antes iba en una tarjeta a la
 * derecha del texto, lo que en móvil la empujaba por debajo del pliegue:
 * quien entraba desde el teléfono leía un titular sin saber de quién era.
 *
 * Sobre la foto van dos velos, y cada uno resuelve algo concreto: el de
 * arriba aclara la zona de la barra de navegación, cuyo texto es violeta y
 * sobre el techo oscuro del gimnasio no se leería; el de abajo oscurece el
 * pie para que el titular en blanco tenga contraste caiga donde caiga el
 * encuadre.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[94svh] flex-col justify-end overflow-hidden lg:min-h-[92vh]">
      {/* Dos archivos: el teléfono no descarga la versión grande. En una
          portada, que es lo primero que se pinta, ese peso se nota. */}
      <picture>
        <source media="(min-width: 768px)" srcSet="/yiyo-portada.webp" />
        <img
          src="/yiyo-portada-movil.webp"
          alt="Daniela «Yiyo» Chacón entrenando en el gimnasio"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[54%_20%] lg:object-[68%_16%]"
        />
      </picture>

      {/* Velo superior: deja legible la barra de navegación. */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-lila-100 via-lila-100/55 to-transparent" />

      {/* Velo inferior: suficiente para que el titular tenga contraste, no
          tanto como para tapar la foto. El resto lo aporta la sombra del
          propio texto. */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-violeta-900/95 via-violeta-900/55 to-transparent" />

      {/* Un tinte de marca sobre la foto, para que el morado no viva solo
          en los textos. */}
      <div className="absolute inset-0 bg-gradient-to-br from-violeta-700/20 via-transparent to-violeta-900/20" />

      <Isotipo
        className="animate-flotar absolute top-32 right-[7%] hidden h-24 opacity-20 lg:block"
        invertido
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-14 sm:pb-16 lg:pb-24">
        <div className="animate-aparecer max-w-xl">
          <span className="letra-ancha inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] text-white/90 uppercase backdrop-blur">
            Coaching fitness &amp; nutrición
          </span>

          <h1 className="mt-6 text-6xl leading-[0.95] font-light tracking-tight text-white [text-shadow:0_2px_24px_rgb(63_26_107_/_0.55)] sm:text-7xl lg:text-8xl">
            Fuerza que
            <span className="font-script mt-1 block text-[1.15em] leading-[1] text-lila-200">
              transforma
            </span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-relaxed font-light text-white/90 [text-shadow:0_1px_12px_rgb(63_26_107_/_0.6)]">
            Soy{" "}
            <strong className="font-medium text-white">
              Daniela «Yiyo» Chacón
            </strong>
            , entrenadora personal y coach fitness. Te acompaño con
            entrenamiento, nutrición y hábitos hechos para tu cuerpo y tu vida
            real
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <BotonEnlace href="/registro" tamano="lg" className="group">
              Empezar mi transformación
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </BotonEnlace>
            <a
              href="#metodo"
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-7 py-4 text-sm font-medium text-white backdrop-blur transition-colors duration-300 hover:border-white/70 hover:bg-white/10"
            >
              Conocer el método
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
