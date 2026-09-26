import { Target, Eye, Gem } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Puntitos } from "@/components/brand/decoraciones";

const bloques = [
  {
    icono: Target,
    titulo: "Misión",
    texto:
      "Educarte y acompañarte en tu proceso de transformación mediante un entrenamiento eficiente, una comunicación cercana y hábitos sostenibles que impulsen tu salud física y mental.",
  },
  {
    icono: Eye,
    titulo: "Visión",
    texto:
      "Ser la plataforma y comunidad de bienestar femenino referente en Latinoamérica, reconocida por su enfoque humano, educativo y sostenible para empoderar a mujeres fuertes y seguras.",
  },
  {
    icono: Gem,
    titulo: "Valores",
    texto: "Comunicación Humana · Educación · Sostenibilidad · Fuerza · Bienestar Integral",
  },
];

export function SobreYiyo() {
  return (
    <section id="yiyo" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 fondo-degradado" />
      <Puntitos className="opacity-15" />
      <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-lila-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative">
            <div className="vidrio relative overflow-hidden rounded-[3rem] border-white/30 bg-white/15 p-12 text-center shadow-elevada">
              {/* La marca completa en vertical: aquí sobra altura, y el
                  nombre ya viene en el propio logo con su tipografía. */}
              <Logo
                orientacion="vertical"
                className="animate-flotar mx-auto h-52 drop-shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                invertido
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.28em] text-lila-200 uppercase">
              Detrás de la plataforma
            </p>
            <h2 className="mt-4 text-4xl leading-tight font-light text-white md:text-5xl">
              Daniela «Yiyo» Chacón
            </h2>
            <p className="mt-6 max-w-xl leading-relaxed font-light text-lila-100/85">
              Venezolana, licenciada en Comunicación Social, entrenadora personal
              y coach de bienestar integral. Desde Santo Domingo, combino la
              comunicación y la ciencia del entrenamiento para guiar a mujeres de
              toda Latinoamérica a construir hábitos sostenibles, entender su
              cuerpo y lograr una transformación real.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed font-light text-lila-100/85">
              Mi propósito no es solo decirte qué hacer, sino comunicarme contigo
              desde la empatía y la educación, brindándote las herramientas
              necesarias para activar tu metabolismo, ganar fuerza y romper
              definitivamente el ciclo de &quot;empezar de cero cada lunes&quot;.
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {bloques.map((b) => (
            <div
              key={b.titulo}
              className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur transition-colors duration-500 hover:bg-white/20"
            >
              <b.icono size={22} strokeWidth={1.5} className="text-lila-200" />
              <h3 className="mt-4 text-sm tracking-widest text-white uppercase">
                {b.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed font-light text-lila-100/90">
                {b.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
