import { Logo } from "@/components/brand/logo";

const bloques = [
  {
    titulo: "Misión",
    texto:
      "Educarte y acompañarte en tu proceso de transformación mediante un entrenamiento eficiente, una comunicación cercana y hábitos sostenibles que impulsen tu salud física y mental.",
  },
  {
    titulo: "Visión",
    texto:
      "Ser la plataforma y comunidad de bienestar femenino referente en Latinoamérica, reconocida por su enfoque humano, educativo y sostenible para empoderar a mujeres fuertes y seguras.",
  },
  {
    titulo: "Valores",
    texto: "Comunicación Humana · Educación · Sostenibilidad · Fuerza · Bienestar Integral",
  },
];

export function SobreYiyo() {
  return (
    <section id="yiyo" className="bg-violeta-700 py-14 text-white sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div className="border border-white/40 p-6 sm:p-10 text-center">
            {/* La marca completa en vertical: aquí sobra altura. */}
            <Logo orientacion="vertical" className="mx-auto h-40 sm:h-48" invertido />
          </div>

          <div>
            <h2 className="text-[clamp(2.75rem,12vw,6rem)] break-words">Daniela «Yiyo» Chacón</h2>
            <p className="mt-8 max-w-2xl text-base leading-7 text-white/90">
              Venezolana, licenciada en Comunicación Social, entrenadora personal
              y coach de bienestar integral. Desde Santo Domingo, combino la
              comunicación y la ciencia del entrenamiento para guiar a mujeres de
              toda Latinoamérica a construir hábitos sostenibles, entender su
              cuerpo y lograr una transformación real.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/90">
              Mi propósito no es solo decirte qué hacer, sino comunicarme contigo
              desde la empatía y la educación, brindándote las herramientas
              necesarias para activar tu metabolismo, ganar fuerza y romper
              definitivamente el ciclo de &quot;empezar de cero cada lunes&quot;.
            </p>
          </div>
        </div>

        <dl className="mt-12 sm:mt-16 grid grid-cols-1 border-t border-white/50 md:grid-cols-3">
          {bloques.map((b) => (
            <div
              key={b.titulo}
              className="border-b border-white/25 py-7 md:border-r md:border-b-0 md:px-6 md:first:pl-0 md:last:border-r-0"
            >
              <dt className="font-display text-3xl font-extrabold uppercase [font-stretch:72%]">
                {b.titulo}
              </dt>
              <dd className="mt-3 text-[15px] leading-6 text-white/85">{b.texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
