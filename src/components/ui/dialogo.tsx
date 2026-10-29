"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialogo({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  ancho = "max-w-2xl",
  children,
}: {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  ancho?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    document.addEventListener("keydown", alPulsar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = "";
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:p-8">
      <div
        className="fixed inset-0 bg-violeta-900/60"
        onClick={alCerrar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          "animate-aparecer relative my-auto w-full max-w-[calc(100vw-2rem)] min-w-0 rounded-sm border border-violeta-900 border-t-[6px] bg-crema p-5 shadow-elevada sm:p-8",
          ancho
        )}
      >
        <button
          onClick={alCerrar}
          className="absolute top-3 right-3 cursor-pointer sm:top-6 sm:right-6 cursor-pointer rounded-sm p-2 text-violeta-900/60 transition-colors hover:bg-violeta-900 hover:text-white"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <h2 className="pr-10 text-2xl break-words text-violeta-900 sm:text-4xl">{titulo}</h2>
        {descripcion && (
          <p className="mt-2 text-sm break-words text-violeta-900/70">{descripcion}</p>
        )}

        <div className="mt-5 min-w-0 sm:mt-7">{children}</div>
      </div>
    </div>
  );
}
