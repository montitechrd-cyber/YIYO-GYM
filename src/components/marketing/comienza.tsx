import { ArrowRight, ClipboardCheck, Sparkles, UserPlus, Zap } from "lucide-react";
import { BotonEnlace } from "@/components/ui/boton";
import { Corazon, Hoja, Puntitos } from "@/components/brand/decoraciones";

const PASOS = [
  {
    numero: "01",
    icono: UserPlus,
    titulo: "Crea tu cuenta",
    detalle: "Gratis, sin tarjeta. Un minuto y ya tienes tu espacio.",
  },
  {
    numero: "02",
    icono: ClipboardCheck,
    titulo: "Cuéntanos de ti",
    detalle:
      "Tu evaluación inicial: objetivo, salud, hábitos. Las medidas te las tomo yo, en persona.",
  },
  {
    numero: "03",
    icono: Zap,
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
 * "tengo cuenta y ya envié mi evaluación". Es deliberadamente la más
 * elaborada de la página — es donde se decide todo.
 */
export function Comienza() {
  return (
    <section id="empieza" className="relative overflow-hidden bg-crema py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[3rem] fondo-degradado px-8 py-16 shadow-elevada md:px-16 md:py-20">
          <Puntitos className="opacity-15" />
          <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -right-20 -bottom-28 h-80 w-80 rounded-full bg-lila-200/25 blur-3xl" />
          <Hoja className="animate-flotar absolute top-10 right-10 hidden h-20 w-20 text-white/15 lg:block" />

          <div className="relative text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[11px] tracking-[0.2em] text-white uppercase backdrop-blur">
              <Sparkles size={13} />
              Empieza gratis, hoy
            </span>

            <h2 className="mx-auto mt-6 max-w-2xl text-4xl leading-tight font-light text-white md:text-5xl">
              Tu transformación empieza con
              <span className="font-script mt-2 block text-4xl text-lila-100 md:text-5xl">
                tres pasos sencillos
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-lg font-light text-lila-100/85">
              Crea tu cuenta, cuéntame de ti y en menos de 48 horas tienes tu
              rutina y tu alimentación listas para empezar.
            </p>
          </div>

          <div className="relative mt-14 grid gap-5 md:grid-cols-3">
            {PASOS.map((p) => (
              <div
                key={p.numero}
                className="relative rounded-4xl border border-white/15 bg-white/10 p-7 text-left backdrop-blur"
              >
                <span className="font-script text-3xl text-lila-100/50">
                  {p.numero}
                </span>
                <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <p.icono size={20} strokeWidth={1.6} />
                </span>
                <h3 className="mt-4 text-lg font-medium text-white">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed font-light text-lila-100/80">
                  {p.detalle}
                </p>
              </div>
            ))}
          </div>

          <div className="relative mt-14 flex flex-col items-center gap-8 border-t border-white/15 pt-10">
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {BENEFICIOS.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2 text-sm font-light text-lila-50"
                >
                  <Corazon className="h-4 w-4 shrink-0 text-lila-200" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap justify-center gap-4">
              <BotonEnlace href="/registro" variante="claro" tamano="lg" className="group">
                Crear mi cuenta gratis
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </BotonEnlace>
              <BotonEnlace
                href="/entrar"
                tamano="lg"
                className="border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                variante="fantasma"
              >
                Ya tengo cuenta
              </BotonEnlace>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
