"use client";

import { useState } from "react";
import { Check, Loader2, Play } from "lucide-react";
import { registrarEntrenamiento } from "./acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import type { DiaConEjercicios } from "@/lib/rutinas";
import { hoyTexto } from "@/lib/programacion";


const SENSACIONES = [
  "Muy bien, con energía",
  "Bien",
  "Normal",
  "Cansada",
  "Muy cansada",
];

export function RegistrarEntrenamiento({
  dias,
  sesionHoy,
}: {
  dias: DiaConEjercicios[];
  sesionHoy: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [diaId, setDiaId] = useState(dias[0]?.id ?? "");
  const { estado, enviar, pendiente } = useAccionFormulario(
    registrarEntrenamiento,
    () => setAbierto(false)
  );

  const dia = dias.find((d) => d.id === diaId) ?? dias[0];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-4xl fondo-degradado px-8 py-7 text-white shadow-suave">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-lila-100 uppercase">
            Hoy toca
          </p>
          <p className="mt-2 text-2xl font-light">
            {dias[0]?.nombre ?? "Entrenamiento"}
          </p>
        </div>
        <Boton variante="claro" onClick={() => setAbierto(true)}>
          <Play size={15} />
          Registrar entrenamiento
        </Boton>
      </div>

      {estado.exito && (
        <Aviso tono="exito" className="mt-4">
          {estado.exito}
        </Aviso>
      )}

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Registrar entrenamiento"
        descripcion="Anota lo que hiciste hoy. Deja en blanco lo que no aplique."
        ancho="max-w-3xl"
      >
        <form action={enviar} className="space-y-7">
          {sesionHoy && <input type="hidden" name="sesion_id" value={sesionHoy} />}
          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Día de la rutina" htmlFor="dia">
              <Seleccion
                id="dia"
                value={diaId}
                onChange={(e) => setDiaId(e.target.value)}
              >
                {dias.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </Seleccion>
            </Campo>
            <Campo etiqueta="Fecha" htmlFor="fecha">
              <Entrada
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={hoyTexto()}
              />
            </Campo>
          </div>

          {dia && dia.ejercicios.length > 0 && (
            <div className="space-y-5">
              <h3 className="text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
                Series realizadas
              </h3>

              {dia.ejercicios.map((a) => (
                <div key={a.id} className="rounded-3xl bg-lila-50 p-5">
                  <p className="text-sm font-medium text-violeta-800">
                    {a.ejercicio.nombre}
                  </p>
                  <p className="mt-1 text-[11px] font-light text-violeta-900/50">
                    Objetivo: {a.series} × {a.repeticiones}
                    {a.peso_sugerido ? ` · ${a.peso_sugerido}` : ""}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr] gap-2 text-[10px] tracking-[0.14em] text-violeta-500 uppercase">
                      <span>#</span>
                      <span>Peso (kg)</span>
                      <span>Reps</span>
                      <span>RPE</span>
                    </div>
                    {Array.from({ length: a.series }, (_, i) => i + 1).map((n) => (
                      <div
                        key={n}
                        className="grid grid-cols-[2.5rem_1fr_1fr_1fr] items-center gap-2"
                      >
                        <span className="text-sm font-light text-violeta-900/45">
                          {n}
                        </span>
                        <Entrada
                          name={`serie_${a.ejercicio_id}_${n}_peso`}
                          type="number"
                          step="0.5"
                          placeholder="—"
                          className="px-3 py-2 text-sm"
                        />
                        <Entrada
                          name={`serie_${a.ejercicio_id}_${n}_reps`}
                          type="number"
                          placeholder={a.repeticiones}
                          className="px-3 py-2 text-sm"
                        />
                        <Entrada
                          name={`serie_${a.ejercicio_id}_${n}_rpe`}
                          type="number"
                          min={1}
                          max={10}
                          placeholder="1-10"
                          className="px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <Campo etiqueta="Duración (min)" htmlFor="duracion_min">
              <Entrada
                id="duracion_min"
                name="duracion_min"
                type="number"
                min={5}
                step={5}
                placeholder="60"
              />
            </Campo>
            <Campo etiqueta="Esfuerzo (RPE)" htmlFor="esfuerzo_rpe">
              <Entrada
                id="esfuerzo_rpe"
                name="esfuerzo_rpe"
                type="number"
                min={1}
                max={10}
                placeholder="7"
              />
            </Campo>
            <Campo etiqueta="¿Cómo te sentiste?" htmlFor="sensacion">
              <Seleccion id="sensacion" name="sensacion" defaultValue="">
                <option value="">Elegir…</option>
                {SENSACIONES.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
              placeholder="Molestias, cosas que ajustar, cómo fue la sesión…"
            />
          </Campo>

          <div className="flex gap-3">
            <Boton type="submit" tamano="lg" disabled={pendiente}>
              {pendiente ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {pendiente ? "Guardando…" : "Guardar entrenamiento"}
            </Boton>
            <Boton
              type="button"
              variante="contorno"
              tamano="lg"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Boton>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
