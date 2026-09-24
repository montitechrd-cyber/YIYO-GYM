"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cancelarMiSuscripcion } from "./acciones";
import { Boton } from "@/components/ui/boton";
import { Dialogo } from "@/components/ui/dialogo";
import { Aviso } from "@/components/ui/aviso";

export function CancelarSuscripcion({ id }: { id: string }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="cursor-pointer text-xs font-light text-lila-100 underline-offset-4 hover:underline"
      >
        Cancelar suscripción
      </button>

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="¿Cancelar tu suscripción?"
        descripcion="Mantendrás el acceso hasta el final del período que ya pagaste. Puedes volver cuando quieras."
        ancho="max-w-lg"
      >
        {error && (
          <Aviso tono="error" className="mb-5">
            {error}
          </Aviso>
        )}

        <div className="flex flex-wrap gap-3">
          <Boton
            variante="contorno"
            onClick={() => setAbierto(false)}
            disabled={enviando}
          >
            Mejor sigo
          </Boton>
          <Boton
            variante="fantasma"
            className="text-rose-600 hover:bg-rose-50"
            disabled={enviando}
            onClick={() =>
              iniciar(async () => {
                const resultado = await cancelarMiSuscripcion(id);
                if (resultado.error) setError(resultado.error);
                else setAbierto(false);
              })
            }
          >
            {enviando && <Loader2 size={15} className="animate-spin" />}
            {enviando ? "Cancelando…" : "Sí, cancelar"}
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}
