"use client";

import { useTransition } from "react";
import { Loader2, UserCheck } from "lucide-react";
import { asignarmeCliente } from "../acciones";
import { Boton } from "@/components/ui/boton";

export function BotonAsignarme({ clienteId }: { clienteId: string }) {
  const [enviando, iniciar] = useTransition();

  return (
    <Boton
      variante="suave"
      tamano="sm"
      disabled={enviando}
      onClick={() => iniciar(async () => void (await asignarmeCliente(clienteId)))}
    >
      {enviando ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <UserCheck size={14} />
      )}
      {enviando ? "Asignando…" : "Asignármela"}
    </Boton>
  );
}
