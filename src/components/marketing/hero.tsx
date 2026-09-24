import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Auroras, Corazon, Hoja, Puntitos } from "@/components/brand/decoraciones";
import { BotonEnlace } from "@/components/ui/boton";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-lila-100 via-crema to-crema pt-36 pb-24 md:pt-44 md:pb-32">
      <Auroras />
      <Puntitos className="opacity-20" />

      <Hoja className="animate-flotar absolute top-32 left-[8%] hidden h-16 w-16 text-lila-300 lg:block" />
      <Hoja className="animate-flotar absolute right-[10%] bottom-32 hidden h-12 w-12 rotate-180 text-lila-400 [animation-delay:2s] lg:block" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-aparecer">
          <span className="inline-flex items-center gap-2 rounded-full border border-lila-300 bg-white/70 px-4 py-1.5 text-[11px] tracking-[0.18em] text-violeta-600 uppercase backdrop-blur">
            <Sparkles size={13} />
            Coaching fitness &amp; nutrición online
          </span>

          <h1 className="mt-7 text-5xl leading-[1.05] font-light tracking-tight text-violeta-900 md:text-7xl">
            No se trata de ser
            <span className="block font-normal">la mejor.</span>
            <span className="text-degradado mt-2 block font-medium">
              Se trata de ser tu mejor versión.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-relaxed font-light text-violeta-900/70">
            Soy <strong className="font-medium text-violeta-700">Daniela «Yiyo» Chacón</strong>,
            entrenadora personal y coach fitness. Te acompaño con entrenamiento,
            nutrición y hábitos diseñados para tu cuerpo, tu ritmo y tu vida real.
          </p>

          <p className="font-script mt-5 text-2xl text-violeta-500">
            Fuerza que te transforma <Corazon className="inline h-5 w-5 align-baseline" />
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <BotonEnlace href="/registro" tamano="lg" className="group">
              Empezar mi transformación
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </BotonEnlace>
            <BotonEnlace href="#metodo" variante="contorno" tamano="lg">
              Conocer el método
            </BotonEnlace>
          </div>
        </div>

        <div className="animate-aparecer relative [animation-delay:0.2s]">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
            {/* Halo neón detrás */}
            <div className="absolute inset-6 rounded-[3.5rem] bg-gradient-to-br from-violeta-500 to-lila-300 opacity-40 blur-3xl" />

            {/* Retrato de Yiyo */}
            <div className="relative h-full overflow-hidden rounded-[3rem] shadow-elevada">
              <Image
                src="/yiyo-hero.jpg"
                alt="Daniela «Yiyo» Chacón entrenando"
                fill
                priority
                sizes="(min-width: 1024px) 28rem, 90vw"
                className="object-cover object-center"
              />

              {/* Velo de marca para que la foto no compita con el texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-violeta-900/55 via-violeta-900/5 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-lila-200/20 to-violeta-500/15" />

              {/* Sello de marca sobre la foto */}
              <div className="vidrio absolute bottom-6 left-6 rounded-3xl px-5 py-3.5 shadow-suave">
                <Logo tamano="sm" />
              </div>
            </div>

            {/* Píldoras flotantes */}
            <div className="vidrio animate-flotar absolute -top-4 -left-6 rounded-2xl px-4 py-3 shadow-suave [animation-delay:1s]">
              <p className="text-[10px] tracking-widest text-violeta-500 uppercase">Disciplina</p>
              <p className="text-sm font-medium text-violeta-800">hoy</p>
            </div>
            <div className="vidrio animate-flotar absolute right-0 -bottom-4 rounded-2xl px-4 py-3 shadow-suave [animation-delay:2.5s]">
              <p className="text-[10px] tracking-widest text-violeta-500 uppercase">Evolución</p>
              <p className="text-sm font-medium text-violeta-800">siempre</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
