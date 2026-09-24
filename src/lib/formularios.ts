"use client";

import { useState, useTransition } from "react";

export type Resultado = { error?: string; exito?: string };

/**
 * Ejecuta una server action desde un `<form action={…}>` y avisa cuando
 * termina bien, para cerrar el diálogo desde el propio callback.
 *
 * Sustituye al patrón `useActionState` + `useEffect(() => setAbierto(false))`,
 * que provoca renders en cascada porque cambia el estado dentro de un efecto.
 */
export function useAccionFormulario(
  accion: (previo: Resultado, datos: FormData) => Promise<Resultado>,
  alTerminarBien?: () => void
) {
  const [estado, setEstado] = useState<Resultado>({});
  const [pendiente, iniciar] = useTransition();

  const enviar = (datos: FormData) =>
    iniciar(async () => {
      const resultado = (await accion({}, datos)) ?? {};
      setEstado(resultado);
      if (!resultado.error) alTerminarBien?.();
    });

  return {
    estado,
    enviar,
    pendiente,
    limpiar: () => setEstado({}),
  };
}
