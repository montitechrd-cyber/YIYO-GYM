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
    <section id="historias" className="bg-lila-100 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="max-w-3xl text-6xl text-violeta-900 md:text-[6rem]">
          Ellas ya son <span className="text-violeta-600">Yiyo</span>
        </h2>

        <div className="mt-14 grid gap-px border-y-2 border-violeta-900 bg-violeta-900/30 md:grid-cols-3">
          {historias.map((h) => (
            <figure key={h.nombre} className="flex flex-col justify-between bg-lila-100 py-8 md:px-8 md:first:pl-0 md:last:pr-0">
              <blockquote className="text-lg leading-7 font-medium text-violeta-900">
                «{h.texto}»
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-violeta-700 text-xs font-bold tracking-wider text-white">
                  {h.iniciales}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-violeta-900">{h.nombre}</span>
                  <span className="block text-xs text-violeta-900/70">{h.detalle}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
