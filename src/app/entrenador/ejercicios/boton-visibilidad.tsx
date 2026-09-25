"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { alternarVisibilidad } from "./acciones";

/** Aparta un ejercicio de la biblioteca o lo devuelve, sin borrar nada. */
export function BotonVisibilidad({
  id,
  visible,
}: {
  id: string;
  visible: boolean;
}) {
  const [enCurso, empezar] = useTransition();

  return (
    <button
      type="button"
      disabled={enCurso}
      onClick={() => empezar(() => alternarVisibilidad(id, !visible))}
      title={visible ? "Apartar de la biblioteca" : "Devolver a la biblioteca"}
      aria-label={visible ? "Apartar de la biblioteca" : "Devolver a la biblioteca"}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-lila-200 text-violeta-500 transition-colors hover:border-lila-400 hover:bg-lila-50 disabled:opacity-40"
    >
      {visible ? <Eye size={15} /> : <EyeOff size={15} />}
    </button>
  );
}
