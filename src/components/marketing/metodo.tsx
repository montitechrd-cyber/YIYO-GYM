import { ClipboardList, CalendarRange, Activity, LineChart } from "lucide-react";

const pasos = [
  {
    numero: "01",
    icono: ClipboardList,
    titulo: "Evaluación inicial",
    texto:
      "Medidas, historial, objetivos y condiciones médicas. Entiendo tu punto de partida real antes de escribir una sola serie.",
  },
  {
    numero: "02",
    icono: CalendarRange,
    titulo: "Tu plan a medida",
    texto:
      "Rutina de entrenamiento y plan de nutrición diseñados para tus días, tu equipo disponible y tus gustos.",
  },
  {
    numero: "03",
    icono: Activity,
    titulo: "Entrenas y registras",
    texto:
      "Cada sesión queda registrada desde tu teléfono: series, repeticiones, peso y cómo te sentiste.",
  },
  {
    numero: "04",
    icono: LineChart,
    titulo: "Ajustamos juntas",
    texto:
      "Reviso tu progreso cada semana, ajusto cargas y macros, y hablamos por chat cuando lo necesites.",
  },
];

export function Metodo() {
  return (
    <section
      id="metodo"
      className="relative overflow-hidden bg-gradient-to-b from-crema via-lila-50 to-crema py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] tracking-[0.28em] text-violeta-500 uppercase">
            El método YIYO
          </p>
          <h2 className="mt-4 text-4xl font-light text-violeta-900 md:text-5xl">
            Cuatro pasos, cero improvisación
          </h2>
          <p className="mt-5 font-light text-violeta-900/65">
            Todo el proceso vive dentro de la plataforma. Sin PDFs perdidos, sin
            audios de WhatsApp que nadie encuentra.
          </p>
        </div>

        <ol className="mt-16 grid gap-6 md:grid-cols-2">
          {pasos.map((p) => (
            <li
              key={p.numero}
              className="group relative overflow-hidden rounded-4xl border border-lila-200/80 bg-white/70 p-9 backdrop-blur transition-all duration-500 hover:border-violeta-500/40 hover:bg-white hover:shadow-elevada"
            >
              <span className="absolute top-6 right-8 text-6xl font-light text-lila-200 transition-colors duration-500 group-hover:text-lila-300">
                {p.numero}
              </span>
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl fondo-degradado text-white shadow-suave">
                <p.icono size={21} strokeWidth={1.6} />
              </span>
              <h3 className="relative mt-6 text-xl font-medium text-violeta-800">
                {p.titulo}
              </h3>
              <p className="relative mt-3 max-w-sm text-sm leading-relaxed font-light text-violeta-900/65">
                {p.texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
