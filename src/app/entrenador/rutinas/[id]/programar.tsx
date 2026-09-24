"use client";

import { useActionState, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { reprogramarRutina, type Resultado } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { hoyTexto } from "@/lib/programacion";

const inicial: Resultado = {};

export function ProgramarRutina({
  rutinaId,
  semanas,
  dias,
}: {
  rutinaId: string;
  semanas: number;
  dias: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, pendiente] = useActionState(reprogramarRutina, inicial);

  return (
    <>
      <Boton variante="contorno" tamano="sm" onClick={() => setAbierto(true)}>
        <CalendarPlus size={15} />
        Programar en el calendario
      </Boton>

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Programar en el calendario"
        descripcion={`Se crearán ${semanas * dias} sesiones (${dias} días por semana durante ${semanas} semanas) en el calendario de la clienta.`}
        ancho="max-w-lg"
      >
        <form action={accion} className="space-y-5">
          <input type="hidden" name="rutina_id" value={rutinaId} />

          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}
          {estado.exito && <Aviso tono="exito">{estado.exito}</Aviso>}

          <Campo
            etiqueta="Empezar la semana del"
            htmlFor="fecha_inicio"
            ayuda="Las sesiones arrancan el lunes de esa semana. Se reemplazan las sesiones programadas que aún no se completaron."
          >
            <Entrada
              id="fecha_inicio"
              name="fecha_inicio"
              type="date"
              defaultValue={hoyTexto()}
            />
          </Campo>

          <div className="flex gap-3">
            <Boton type="submit" disabled={pendiente}>
              {pendiente && <Loader2 size={15} className="animate-spin" />}
              {pendiente ? "Programando…" : "Programar"}
            </Boton>
            <Boton type="button" variante="contorno" onClick={() => setAbierto(false)}>
              Cerrar
            </Boton>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
