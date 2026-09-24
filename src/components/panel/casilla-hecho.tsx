"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { marcarEjercicioHecho } from "@/app/panel/entrenamientos/acciones";
import { cn } from "@/lib/utils";

/**
 * El botón «Hecho» de un ejercicio, en la esquina de su tarjeta.
 *
 * Cambia de aspecto al tocarlo antes de que el servidor confirme —si la
 * escritura falla, vuelve atrás sola— y llama a la misma acción que usa el
 * formulario completo de registrar entrenamiento, así que ambas formas de
 * marcar avance terminan en el mismo sitio.
 */
export function CasillaHecho({
  diaId,
  ejercicioId,
  hecho: hechoInicial,
}: {
  diaId: string;
  ejercicioId: string;
  hecho: boolean;
}) {
  const [hecho, setHecho] = useState(hechoInicial);
  const [fallo, setFallo] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const alternar = () => {
    const siguiente = !hecho;
    setHecho(siguiente);
    setFallo(false);
    iniciar(async () => {
      const r = await marcarEjercicioHecho(diaId, ejercicioId, siguiente);
      // Si falla, la marca vuelve atras; sin avisar, la clienta solo veia que
      // "no funciona" sin saber por que.
      if (r?.error) {
        setHecho(!siguiente);
        setFallo(true);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pendiente}
      aria-pressed={hecho}
      aria-label={hecho ? "Marcar como no hecho" : "Marcar como hecho"}
      className={cn(
        "absolute top-4 right-4 z-10 flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium shadow-suave backdrop-blur transition-all duration-300",
        pendiente && "opacity-70",
        fallo
          ? "bg-rose-500 text-white"
          : hecho
            ? "bg-emerald-500 text-white"
            : "bg-white/90 text-violeta-500 hover:bg-white"
      )}
    >
      <Check size={14} className={cn(!hecho && "opacity-50")} />
      {fallo ? "Reintentar" : hecho ? "Hecho" : "Marcar"}
    </button>
  );
}
