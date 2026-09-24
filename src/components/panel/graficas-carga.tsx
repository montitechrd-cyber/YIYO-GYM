"use client";

import dynamic from "next/dynamic";

/**
 * Recharts es la librería más pesada del proyecto. Cargándola aparte, las
 * páginas que no dibujan gráficas no pagan su peso, y las que sí lo hacen
 * pintan el resto de la página sin esperarla.
 */
const Esqueleto = ({ alto }: { alto: number }) => (
  <div
    className="animate-brillo w-full rounded-3xl bg-lila-100"
    style={{ height: alto }}
    aria-hidden="true"
  />
);

export const GraficaArea = dynamic(
  () => import("./graficas").then((m) => m.GraficaArea),
  { ssr: false, loading: () => <Esqueleto alto={280} /> }
);

export const GraficaLineas = dynamic(
  () => import("./graficas").then((m) => m.GraficaLineas),
  { ssr: false, loading: () => <Esqueleto alto={300} /> }
);

export const GraficaBarras = dynamic(
  () => import("./graficas").then((m) => m.GraficaBarras),
  { ssr: false, loading: () => <Esqueleto alto={260} /> }
);
