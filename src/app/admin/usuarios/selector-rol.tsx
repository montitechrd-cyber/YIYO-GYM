"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cambiarRol } from "../acciones";
import { Seleccion } from "@/components/ui/campo";
import { Insignia } from "@/components/panel/piezas";
import { ROLES } from "@/lib/etiquetas";
import type { RolUsuario } from "@/lib/supabase/tipos";

export function SelectorRol({
  perfilId,
  rol,
  esYo,
}: {
  perfilId: string;
  rol: RolUsuario;
  esYo: boolean;
}) {
  const [guardando, iniciar] = useTransition();

  if (esYo) {
    return <Insignia tono="violeta">{ROLES[rol]} (tú)</Insignia>;
  }

  return (
    <div className="flex items-center gap-2">
      <Seleccion
        defaultValue={rol}
        disabled={guardando}
        className="w-44 px-3 py-2 text-sm"
        onChange={(e) => {
          const nuevo = e.target.value as RolUsuario;
          iniciar(async () => {
            await cambiarRol(perfilId, nuevo);
          });
        }}
      >
        {Object.entries(ROLES).map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </Seleccion>
      {guardando && <Loader2 size={14} className="animate-spin text-violeta-500" />}
    </div>
  );
}
