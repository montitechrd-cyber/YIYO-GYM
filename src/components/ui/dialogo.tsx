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
        className="fixed inset-0 bg-violeta-900/45 backdrop-blur-sm"
        onClick={alCerrar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          "animate-aparecer relative my-auto w-full rounded-4xl bg-white p-8 shadow-elevada",
          ancho
        )}
      >
        <button
          onClick={alCerrar}
          className="absolute top-6 right-6 cursor-pointer rounded-full p-2 text-violeta-900/40 transition-colors hover:bg-lila-100 hover:text-violeta-700"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <h2 className="pr-10 text-2xl font-light text-violeta-900">{titulo}</h2>
        {descripcion && (
          <p className="mt-2 text-sm font-light text-violeta-900/55">{descripcion}</p>
        )}

        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
