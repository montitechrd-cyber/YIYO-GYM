import { Target, Eye, Gem } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Corazon, Puntitos } from "@/components/brand/decoraciones";

const bloques = [
  {
    icono: Target,
    titulo: "Misión",
    texto:
      "Inspirar a las mujeres a alcanzar su mejor versión a través del entrenamiento, la comunidad y el bienestar integral.",
  },
  {
    icono: Eye,
    titulo: "Visión",
    texto:
      "Ser el gimnasio femenino líder que transforma vidas, empoderando a mujeres fuertes, saludables y seguras de sí mismas.",
  },
  {
    icono: Gem,
    titulo: "Valores",
    texto: "Fuerza · Disciplina · Respeto · Bienestar · Comunidad",
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
              <p className="font-script mt-6 text-xl text-lila-100">
                Tú puedes. Tú vales. Tú eres YIYO.{" "}
                <Corazon className="inline h-4 w-4 align-baseline" />
              </p>
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
              Venezolana, entrenadora personal y coach fitness online con años de
              experiencia en fitness, wellness, salud, nutrición y estilo de vida.
              Trabajo desde Santo Domingo con mujeres de toda Latinoamérica que
              quieren dejar de empezar de cero cada lunes.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {bloques.map((b) => (
                <div
                  key={b.titulo}
                  className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur transition-colors duration-500 hover:bg-white/20"
                >
                  <b.icono size={22} strokeWidth={1.5} className="text-lila-200" />
                  <h3 className="mt-4 text-sm tracking-widest text-white uppercase">
                    {b.titulo}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed font-light text-lila-100/80">
                    {b.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
