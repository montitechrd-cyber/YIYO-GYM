import { Quote } from "lucide-react";
import { Hoja } from "@/components/brand/decoraciones";

const historias = [
  {
    nombre: "Alejandra M.",
    detalle: "8 meses en Transformación",
    texto:
      "Llevaba años empezando dietas los lunes. Con Yiyo entendí que el problema no era mi fuerza de voluntad, era no tener un plan hecho para mí.",
    iniciales: "AM",
  },
  {
    nombre: "Carolina R.",
    detalle: "1 año en Élite",
    texto:
      "Bajé 14 kilos, pero lo que más valoro es que ahora levanto peso sin miedo y me veo al espejo distinto. La app me mantiene enganchada.",
    iniciales: "CR",
  },
  {
    nombre: "Nathalie P.",
    detalle: "5 meses en Esencial",
    texto:
      "Ver mis gráficas de progreso cada semana es adictivo. Por primera vez tengo pruebas de que sí estoy avanzando.",
    iniciales: "NP",
  },
];

export function Historias() {
  return (
    <section
      id="historias"
      className="relative overflow-hidden bg-gradient-to-b from-crema to-lila-100 py-24"
    >
      <Hoja className="absolute top-16 right-[6%] hidden h-20 w-20 rotate-12 text-lila-300/60 lg:block" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] tracking-[0.28em] text-violeta-500 uppercase">
            Historias reales
          </p>
          <h2 className="mt-4 text-4xl font-light text-violeta-900 md:text-5xl">
            Ellas ya son{" "}
            <span className="font-script text-degradado text-5xl md:text-6xl">Yiyo</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {historias.map((h) => (
            <figure
              key={h.nombre}
              className="group relative flex flex-col justify-between rounded-4xl border border-lila-200 bg-white/80 p-8 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-elevada"
            >
              <Quote
                size={30}
                strokeWidth={1.2}
                className="text-lila-300 transition-colors duration-500 group-hover:text-violeta-500"
              />
              <blockquote className="mt-5 text-sm leading-relaxed font-light text-violeta-900/75">
                «{h.texto}»
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3 border-t border-lila-200 pt-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full fondo-degradado text-xs font-medium tracking-wider text-white">
                  {h.iniciales}
                </span>
                <span>
                  <span className="block text-sm font-medium text-violeta-800">
                    {h.nombre}
                  </span>
                  <span className="block text-[11px] font-light text-violeta-900/50">
                    {h.detalle}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
