import { Dumbbell, Heart, Flower2, TrendingUp, Users } from "lucide-react";
import { Separador } from "@/components/brand/decoraciones";

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
    <section className="relative bg-crema py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-[11px] tracking-[0.28em] text-violeta-500 uppercase">
            Somos Yiyo
          </p>
          <h2 className="mt-4 text-4xl font-light text-violeta-900 md:text-5xl">
            Un espacio para <span className="font-script text-degradado text-5xl md:text-6xl">ti</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-light text-violeta-900/65">
            Para tu cuerpo, tu mente y tu crecimiento. Cinco pilares que sostienen
            cada plan que diseño.
          </p>
          <Separador className="mt-8" />
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {valores.map((v, i) => (
            <article
              key={v.titulo}
              className={`group relative overflow-hidden rounded-4xl border border-lila-200 bg-white p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-lila-400 hover:shadow-elevada ${
                i === 0 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-lila-100 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-lila-100 text-violeta-600 transition-colors duration-500 group-hover:bg-violeta-500 group-hover:text-white">
                  <v.icono size={24} strokeWidth={1.5} />
                </span>
                <h3 className="mt-6 text-xl font-medium text-violeta-800">{v.titulo}</h3>
                <p className="mt-3 text-sm leading-relaxed font-light text-violeta-900/65">
                  {v.texto}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
