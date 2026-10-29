"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Entrada } from "./campo";
import { cn } from "@/lib/utils";

/**
 * Campo de contraseña con botón para ver u ocultar lo escrito. Cada campo
 * lleva su propio botón, así «repetir contraseña» también se puede revisar.
 */
export function EntradaClave({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [ver, setVer] = useState(false);

  return (
    <div className="relative">
      <Entrada
        {...props}
        type={ver ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        className="absolute top-1/2 right-1 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-violeta-600 transition-colors hover:text-violeta-900 focus-visible:outline-2 focus-visible:outline-violeta-700"
        aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={ver}
      >
        {ver ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
