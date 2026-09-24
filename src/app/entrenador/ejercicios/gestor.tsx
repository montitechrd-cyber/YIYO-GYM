"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { borrarEjercicio, guardarEjercicio } from "./acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import { GRUPOS, NIVELES } from "@/lib/etiquetas";
import type { Ejercicio } from "@/lib/supabase/tipos";


export function GestorEjercicios({
  modo,
  ejercicio,
}: {
  modo: "crear" | "editar";
  ejercicio?: Ejercicio;
}) {
  const [abierto, setAbierto] = useState(false);
  const { estado, enviar, pendiente } = useAccionFormulario(
    guardarEjercicio,
    () => setAbierto(false)
  );
  const [borrando, setBorrando] = useState(false);

  return (
    <>
      {modo === "crear" ? (
        <Boton onClick={() => setAbierto(true)}>
          <Plus size={16} />
          Nuevo ejercicio
        </Boton>
      ) : (
        <div className="flex gap-2">
          <Boton variante="suave" tamano="sm" onClick={() => setAbierto(true)}>
            <Pencil size={13} />
            Editar
          </Boton>
          <Boton
            variante="fantasma"
            tamano="sm"
            disabled={borrando}
            onClick={async () => {
              setBorrando(true);
              try {
                await borrarEjercicio(ejercicio!.id);
              } finally {
                setBorrando(false);
              }
            }}
            className="text-rose-600 hover:bg-rose-50"
          >
            {borrando ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </Boton>
        </div>
      )}

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo={modo === "crear" ? "Nuevo ejercicio" : "Editar ejercicio"}
        descripcion="Los ejercicios de la biblioteca se usan al construir rutinas"
      >
        <form action={enviar} className="space-y-5">
          {ejercicio && <input type="hidden" name="id" value={ejercicio.id} />}
          <input
            type="hidden"
            name="imagen_actual"
            value={ejercicio?.imagen_url ?? ""}
          />
          <input
            type="hidden"
            name="video_actual"
            value={ejercicio?.video_url ?? ""}
          />

          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          <Campo etiqueta="Nombre" htmlFor="nombre">
            <Entrada
              id="nombre"
              name="nombre"
              defaultValue={ejercicio?.nombre ?? ""}
              placeholder="Sentadilla búlgara"
              required
            />
          </Campo>

          <div className="grid gap-5 sm:grid-cols-3">
            <Campo etiqueta="Grupo muscular" htmlFor="grupo">
              <Seleccion
                id="grupo"
                name="grupo"
                defaultValue={ejercicio?.grupo ?? "gluteos"}
                required
              >
                {Object.entries(GRUPOS).map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </Seleccion>
            </Campo>

            <Campo etiqueta="Nivel" htmlFor="nivel">
              <Seleccion
                id="nivel"
                name="nivel"
                defaultValue={ejercicio?.nivel ?? "principiante"}
              >
                {Object.entries(NIVELES).map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </Seleccion>
            </Campo>

            <Campo etiqueta="Equipo" htmlFor="equipo">
              <Entrada
                id="equipo"
                name="equipo"
                defaultValue={ejercicio?.equipo ?? ""}
                placeholder="Mancuernas"
              />
            </Campo>
          </div>

          <Campo etiqueta="Instrucciones" htmlFor="instrucciones">
            <AreaTexto
              id="instrucciones"
              name="instrucciones"
              defaultValue={ejercicio?.instrucciones ?? ""}
              className="min-h-24"
              placeholder="Cómo ejecutar el movimiento paso a paso…"
            />
          </Campo>

          <Campo etiqueta="Consejos" htmlFor="consejos">
            <AreaTexto
              id="consejos"
              name="consejos"
              defaultValue={ejercicio?.consejos ?? ""}
              className="min-h-20"
              placeholder="Errores comunes, tips de técnica…"
            />
          </Campo>

          <div className="rounded-3xl border border-lila-200 bg-lila-50/50 p-5">
            <p className="mb-4 text-[11px] tracking-[0.18em] text-violeta-500 uppercase">
              Video del ejercicio
            </p>

            <Campo
              etiqueta="Pegar enlace"
              htmlFor="video_url"
              ayuda="YouTube o Vimeo. Es la opción recomendada: no ocupa espacio y carga rápido."
            >
              <Entrada
                id="video_url"
                name="video_url"
                type="url"
                defaultValue={
                  ejercicio?.video_url?.startsWith("http") &&
                  !ejercicio.video_url.includes("/storage/v1/")
                    ? ejercicio.video_url
                    : ""
                }
                placeholder="https://youtube.com/watch?v=…"
              />
            </Campo>

            <Campo
              etiqueta="…o subir el archivo"
              htmlFor="video"
              className="mt-4"
              ayuda="MP4 o WebM, hasta 50 MB. Si escribes un enlace arriba, ese manda."
            >
              <Entrada
                id="video"
                name="video"
                type="file"
                accept="video/*"
                className="file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-lila-200 file:px-4 file:py-1.5 file:text-xs file:text-violeta-700"
              />
            </Campo>

            {ejercicio?.video_url && (
              <p className="mt-3 text-xs font-light text-violeta-900/55">
                Ya tiene video cargado. Deja todo vacío para conservarlo.
              </p>
            )}
          </div>

          <Campo
            etiqueta="Imagen"
            htmlFor="imagen"
            ayuda={
              ejercicio?.imagen_url
                ? "Ya tiene imagen. Sube otra para reemplazarla. Solo se ve si el ejercicio no tiene video."
                : "Se muestra cuando el ejercicio no tiene video."
            }
          >
            <Entrada
              id="imagen"
              name="imagen"
              type="file"
              accept="image/*"
              className="file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-lila-200 file:px-4 file:py-1.5 file:text-xs file:text-violeta-700"
            />
          </Campo>

          <div className="flex gap-3 pt-2">
            <Boton type="submit" disabled={pendiente}>
              {pendiente && <Loader2 size={15} className="animate-spin" />}
              {pendiente ? "Guardando…" : "Guardar"}
            </Boton>
            <Boton
              type="button"
              variante="contorno"
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
