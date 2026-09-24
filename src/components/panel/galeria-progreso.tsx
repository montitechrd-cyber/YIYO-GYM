import { ImageOff } from "lucide-react";
import { FECHA_LARGA, fechaLocal } from "@/lib/etiquetas";

export type FotoProgreso = { fecha: string; url: string };

/**
 * Fotos del bucket privado. Llegan ya firmadas desde el servidor porque el
 * bucket no es público y la URL caduca.
 */
export function GaleriaProgreso({ fotos }: { fotos: FotoProgreso[] }) {
  if (fotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-lila-300 px-6 py-12 text-center">
        <ImageOff size={26} strokeWidth={1.3} className="text-violeta-500/40" />
        <p className="mt-4 text-sm font-light text-violeta-900/50">
          Todavía no hay fotos de progreso.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {fotos.map((f) => (
        <figure
          key={f.url}
          className="overflow-hidden rounded-3xl border border-lila-200 bg-lila-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={f.url}
            alt={`Progreso del ${f.fecha}`}
            className="aspect-[3/4] w-full object-cover"
            loading="lazy"
          />
          <figcaption className="px-3 py-2 text-center text-[10px] font-light text-violeta-900/50">
            {FECHA_LARGA.format(fechaLocal(f.fecha))}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
