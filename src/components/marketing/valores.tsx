import { Dumbbell, Heart, Flower2, TrendingUp, Users } from "lucide-react";

const valores = [
  {
    icono: Dumbbell,
    titulo: "Fuerza",
    texto: "Entrenamiento progresivo que construye músculo, postura y confianza.",
  },
  {
    icono: Heart,
    titulo: "Bienestar",
    texto: "Nutrición sin restricciones absurdas. Comida real, sostenible y rica.",
  },
  {
    icono: Flower2,
    titulo: "Disciplina",
    texto: "Hábitos pequeños y constantes. La motivación va y viene, el sistema queda.",
  },
  {
    icono: TrendingUp,
    titulo: "Evolución",
    texto: "Medimos todo: peso, medidas, fotos y fuerza. Los datos no mienten.",
  },
  {
    icono: Users,
    titulo: "Comunidad",
    texto: "Nunca sola. Chat directo conmigo y una tribu que te sostiene.",
  },
];

export function Valores() {
  return (
    <section className="bg-crema py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-6xl text-violeta-900 md:text-[6rem]">
            Un espacio
            <span className="block text-violeta-600">para ti</span>
          </h2>
          <p className="mt-6 max-w-sm text-base leading-7 text-violeta-900/80">
            Para tu cuerpo, tu mente y tu crecimiento. Cinco pilares que
            sostienen cada plan que diseño.
          </p>
        </div>

        <ol className="border-t-2 border-violeta-900">
          {valores.map((v) => (
            <li
              key={v.titulo}
              className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-1 border-b border-violeta-900/25 py-7 transition-colors duration-200 hover:bg-lila-100 sm:grid-cols-[3rem_13rem_1fr] sm:px-3"
            >
              <v.icono size={26} strokeWidth={1.8} className="row-span-2 text-violeta-700 sm:row-span-1" />
              <h3 className="text-4xl text-violeta-900 uppercase">{v.titulo}</h3>
              <p className="col-start-2 text-[15px] leading-6 text-violeta-900/75 sm:col-start-3">
                {v.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
