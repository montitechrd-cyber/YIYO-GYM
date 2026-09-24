"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { registrarProgreso } from "./acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import { MEDIDAS } from "@/lib/etiquetas";
import { hoyTexto } from "@/lib/programacion";


export function RegistrarProgreso({
  clienteId,
  etiqueta = "Registrar progreso",
}: {
  /** Si se indica, lo registra la entrenadora para esa clienta. */
  clienteId?: string;
  etiqueta?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const { estado, enviar, pendiente } = useAccionFormulario(
    registrarProgreso,
    () => setAbierto(false)
  );

  return (
    <>
      <Boton onClick={() => setAbierto(true)}>
        <Plus size={16} />
        {etiqueta}
      </Boton>

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Registrar progreso"
        descripcion={
          clienteId
            ? "El peso inicial, su % de grasa, % de músculo y una foto. Repítelo cada mes para ver su evolución."
            : "Mídete siempre en las mismas condiciones: en ayunas y a la misma hora."
        }
      >
        <form action={enviar} className="space-y-7">
          {clienteId && <input type="hidden" name="cliente_id" value={clienteId} />}
          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          <div className="grid gap-5 sm:grid-cols-4">
            <Campo etiqueta="Fecha" htmlFor="fecha">
              <Entrada
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={hoyTexto()}
              />
            </Campo>
            <Campo etiqueta="Peso (kg)" htmlFor="peso_kg">
              <Entrada
                id="peso_kg"
                name="peso_kg"
                type="number"
                step="0.1"
                placeholder="68.5"
              />
            </Campo>
            <Campo etiqueta="Grasa (%)" htmlFor="grasa_pct">
              <Entrada
                id="grasa_pct"
                name="grasa_pct"
                type="number"
                step="0.1"
                placeholder="28"
              />
            </Campo>
            <Campo etiqueta="Músculo (%)" htmlFor="musculo_pct">
              <Entrada
                id="musculo_pct"
                name="musculo_pct"
                type="number"
                step="0.1"
                placeholder="34"
              />
            </Campo>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
              Medidas (cm)
            </h3>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {MEDIDAS.map((m) => (
                <Campo key={m.clave} etiqueta={m.etiqueta} htmlFor={`medida_${m.clave}`}>
                  <Entrada
                    id={`medida_${m.clave}`}
                    name={`medida_${m.clave}`}
                    type="number"
                    step="0.1"
                    placeholder="—"
                    className="px-3 py-2 text-sm"
                  />
                </Campo>
              ))}
            </div>
          </div>

          <Campo
            etiqueta="Fotos de progreso"
            htmlFor="fotos"
            ayuda="Privadas: solo tú y Yiyo pueden verlas."
          >
            <Entrada
              id="fotos"
              name="fotos"
              type="file"
              accept="image/*"
              multiple
              className="file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-lila-200 file:px-4 file:py-1.5 file:text-xs file:text-violeta-700"
            />
          </Campo>

          <Campo etiqueta="Notas" htmlFor="notas">
            <AreaTexto
              id="notas"
              name="notas"
              className="min-h-20"
              placeholder="Cómo te sientes, cambios que notas…"
            />
          </Campo>

          <div className="flex gap-3">
            <Boton type="submit" disabled={pendiente}>
              {pendiente && <Loader2 size={15} className="animate-spin" />}
              {pendiente ? "Guardando…" : "Guardar"}
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
