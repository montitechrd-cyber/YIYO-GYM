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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 bg-violeta-900/60"
        onClick={alCerrar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          "animate-aparecer relative my-auto w-full rounded-sm border border-violeta-900 border-t-[6px] bg-crema p-8 shadow-elevada",
          ancho
        )}
      >
        <button
          onClick={alCerrar}
          className="absolute top-6 right-6 cursor-pointer rounded-sm p-2 text-violeta-900/60 transition-colors hover:bg-violeta-900 hover:text-white"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <h2 className="pr-10 text-4xl text-violeta-900">{titulo}</h2>
        {descripcion && (
          <p className="mt-2 text-sm text-violeta-900/70">{descripcion}</p>
        )}

        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
