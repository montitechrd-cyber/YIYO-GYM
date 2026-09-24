"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { borrarAlimento, guardarAlimento } from "../dietas/acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import { CATEGORIAS_ALIMENTO } from "@/lib/nutricion";
import type { Alimento } from "@/lib/supabase/tipos";

export function GestorAlimento({
  modo,
  alimento,
}: {
  modo: "crear" | "editar";
  alimento?: Alimento;
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [unidad, setUnidad] = useState(alimento?.unidad ?? "g");
  const { estado, enviar, pendiente } = useAccionFormulario(guardarAlimento, () =>
    setAbierto(false)
  );

  const porUnidad = unidad === "unidad";
  const referencia = porUnidad ? "por unidad" : `por 100 ${unidad}`;

  return (
    <>
      {modo === "crear" ? (
        <Boton onClick={() => setAbierto(true)}>
          <Plus size={16} />
          Nuevo alimento
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
            className="text-rose-600 hover:bg-rose-50"
            onClick={async () => {
              setBorrando(true);
              try {
                await borrarAlimento(alimento!.id);
              } finally {
                setBorrando(false);
              }
            }}
          >
            {borrando ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </Boton>
        </div>
      )}

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo={modo === "crear" ? "Nuevo alimento" : "Editar alimento"}
        descripcion="Los valores se guardan por 100 g o 100 ml, salvo los que se cuentan por unidad."
      >
        <form action={enviar} className="space-y-5">
          {alimento && <input type="hidden" name="id" value={alimento.id} />}
          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Nombre" htmlFor="nombre">
              <Entrada
                id="nombre"
                name="nombre"
                defaultValue={alimento?.nombre ?? ""}
                placeholder="Pechuga de pollo"
                required
              />
            </Campo>
            <Campo etiqueta="Marca (opcional)" htmlFor="marca">
              <Entrada
                id="marca"
                name="marca"
                defaultValue={alimento?.marca ?? ""}
                placeholder="Si es un producto concreto"
              />
            </Campo>
            <Campo etiqueta="Categoría" htmlFor="categoria">
              <Seleccion
                id="categoria"
                name="categoria"
                defaultValue={alimento?.categoria ?? "otro"}
              >
                {Object.entries(CATEGORIAS_ALIMENTO).map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </Seleccion>
            </Campo>
            <Campo etiqueta="Cómo se mide" htmlFor="unidad">
              <Seleccion
                id="unidad"
                name="unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value as typeof unidad)}
              >
                <option value="g">En gramos</option>
                <option value="ml">En mililitros</option>
                <option value="unidad">Por unidad (huevo, rebanada…)</option>
              </Seleccion>
            </Campo>
          </div>

          <div className="rounded-3xl border border-lila-200 bg-lila-50/60 p-5">
            <p className="mb-4 text-[11px] tracking-[0.18em] text-violeta-500 uppercase">
              Valores {referencia}
            </p>
            <div className="grid gap-4 sm:grid-cols-5">
              {[
                { n: "calorias", e: "Calorías", v: alimento?.calorias },
                { n: "proteina_g", e: "Proteína (g)", v: alimento?.proteina_g },
                {
                  n: "carbohidratos_g",
                  e: "Carbos (g)",
                  v: alimento?.carbohidratos_g,
                },
                { n: "grasa_g", e: "Grasa (g)", v: alimento?.grasa_g },
                { n: "fibra_g", e: "Fibra (g)", v: alimento?.fibra_g },
              ].map((c) => (
                <Campo key={c.n} etiqueta={c.e} htmlFor={c.n}>
                  <Entrada
                    id={c.n}
                    name={c.n}
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={c.v ?? ""}
                    placeholder="0"
                    className="bg-white px-3 py-2 text-sm"
                  />
                </Campo>
              ))}
            </div>

            {porUnidad && (
              <Campo
                etiqueta="Peso de una unidad (g)"
                htmlFor="gramos_por_unidad"
                className="mt-4 max-w-52"
                ayuda="Sirve de referencia para convertir a gramos."
              >
                <Entrada
                  id="gramos_por_unidad"
                  name="gramos_por_unidad"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={alimento?.gramos_por_unidad ?? ""}
                  placeholder="50"
                  className="bg-white"
                />
              </Campo>
            )}
          </div>

          <div className="flex gap-3 pt-2">
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
