"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { crearSesion } from "./acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import type { DiaAgendable } from "@/lib/rutinas";
import { hoyTexto } from "@/lib/programacion";


export function NuevaSesion({
  clientes,
  diasDeRutina,
}: {
  clientes: { id: string; nombre: string }[];
  /** Días de las rutinas asignadas, para agendar contenido real. */
  diasDeRutina: DiaAgendable[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const { estado, enviar, pendiente } = useAccionFormulario(
    crearSesion,
    () => setAbierto(false)
  );

  // Solo tiene sentido ofrecer los días de la rutina de esa clienta.
  const diasDisponibles = diasDeRutina.filter((d) => d.clienteId === clienteId);

  return (
    <>
      <Boton onClick={() => setAbierto(true)}>
        <Plus size={16} />
        Nueva sesión
      </Boton>

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Programar sesión"
        descripcion="Puedes repetirla varias semanas seguidas de una vez."
      >
        <form action={enviar} className="space-y-5">
          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          <Campo etiqueta="Clienta" htmlFor="cliente_id">
            <Seleccion
              id="cliente_id"
              name="cliente_id"
              required
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="" disabled>
                Elige una clienta…
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Seleccion>
          </Campo>

          <Campo
            etiqueta="Día de su rutina"
            htmlFor="rutina_dia_id"
            ayuda={
              !clienteId
                ? "Elige primero la clienta."
                : diasDisponibles.length === 0
                  ? "Esta clienta no tiene rutina asignada todavía. La sesión quedará como cita suelta."
                  : "La clienta verá los ejercicios y videos de ese día al abrir la sesión."
            }
          >
            <Seleccion
              id="rutina_dia_id"
              name="rutina_dia_id"
              defaultValue=""
              disabled={diasDisponibles.length === 0}
            >
              <option value="">Sin rutina (cita suelta)</option>
              {diasDisponibles.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.etiqueta}
                </option>
              ))}
            </Seleccion>
          </Campo>

          <Campo
            etiqueta="Título"
            htmlFor="titulo"
            ayuda="Si lo dejas vacío y elegiste un día de rutina, se usa su nombre."
          >
            <Entrada
              id="titulo"
              name="titulo"
              placeholder="Pierna y glúteo"
            />
          </Campo>

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Fecha" htmlFor="fecha">
              <Entrada
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={hoyTexto()}
                required
              />
            </Campo>
            <Campo etiqueta="Hora" htmlFor="hora">
              <Entrada id="hora" name="hora" type="time" defaultValue="07:00" />
            </Campo>
            <Campo etiqueta="Duración (min)" htmlFor="duracion_min">
              <Entrada
                id="duracion_min"
                name="duracion_min"
                type="number"
                min={15}
                step={5}
                defaultValue={60}
              />
            </Campo>
            <Campo
              etiqueta="Repetir"
              htmlFor="repetir"
              ayuda="Crea la misma sesión cada semana."
            >
              <Seleccion id="repetir" name="repetir" defaultValue="1">
                {[1, 2, 4, 6, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? "Solo una vez" : `${n} semanas`}
                  </option>
                ))}
              </Seleccion>
            </Campo>
          </div>

          <Campo etiqueta="Notas" htmlFor="notas">
            <AreaTexto
              id="notas"
              name="notas"
              className="min-h-20"
              placeholder="Algo que deba recordar de esta sesión…"
            />
          </Campo>

          <div className="flex gap-3 pt-2">
            <Boton type="submit" disabled={pendiente}>
              {pendiente && <Loader2 size={15} className="animate-spin" />}
              {pendiente ? "Creando…" : "Programar"}
            </Boton>
            <Boton type="button" variante="contorno" onClick={() => setAbierto(false)}>
              Cancelar
            </Boton>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
