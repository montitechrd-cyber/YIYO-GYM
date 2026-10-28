const pasos = [
  {
    numero: "1",
    titulo: "Evaluación inicial",
    texto:
      "Medidas, historial, objetivos y condiciones médicas. Entiendo tu punto de partida real antes de escribir una sola serie.",
  },
  {
    numero: "2",
    titulo: "Tu plan a medida",
    texto:
      "Rutina de entrenamiento y plan de nutrición diseñados para tus días, tu equipo disponible y tus gustos.",
  },
  {
    numero: "3",
    titulo: "Entrenas y registras",
    texto:
      "Cada sesión queda registrada desde tu teléfono: series, repeticiones, peso y cómo te sentiste.",
  },
  {
    numero: "4",
    titulo: "Ajustamos juntas",
    texto:
      "Reviso tu progreso cada semana, ajusto cargas y macros, y hablamos por chat cuando lo necesites.",
  },
];

/** Cuatro pasos como números de dorsal: aquí la secuencia sí es información. */
export function Metodo() {
  return (
    <section id="metodo" className="bg-lila-200 py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-3xl text-[clamp(2.75rem,12vw,6rem)] break-words text-violeta-900">
            Cuatro pasos, cero improvisación
          </h2>
          <p className="max-w-sm text-base leading-7 text-violeta-900/85">
            Todo el proceso vive dentro de la plataforma. Sin PDFs perdidos, sin
            audios de WhatsApp que nadie encuentra.
          </p>
        </div>

        <ol className="mt-10 sm:mt-14 grid grid-cols-1 border-t-2 border-violeta-900 md:grid-cols-4">
          {pasos.map((p) => (
            <li
              key={p.numero}
              className="border-b border-violeta-900/30 py-8 md:border-r md:border-b-0 md:px-6 md:first:pl-0 md:last:border-r-0"
            >
              <span className="cifra block text-[clamp(4.5rem,24vw,7rem)] text-violeta-700">{p.numero}</span>
              <h3 className="mt-4 text-3xl text-violeta-900 uppercase">{p.titulo}</h3>
              <p className="mt-3 text-[15px] leading-6 text-violeta-900/80">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
