"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { borrarPlan, guardarPlan } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import type { Plan } from "@/lib/supabase/tipos";


export function GestorPlan({
  modo,
  plan,
}: {
  modo: "crear" | "editar";
  plan?: Plan;
}) {
  const [abierto, setAbierto] = useState(false);
  const { estado, enviar, pendiente } = useAccionFormulario(guardarPlan, () =>
    setAbierto(false)
  );
  const [borrando, setBorrando] = useState(false);

  return (
    <>
      {modo === "crear" ? (
        <Boton onClick={() => setAbierto(true)}>
          <Plus size={16} />
          Nuevo plan
        </Boton>
      ) : (
        <div className="flex gap-2">
          <Boton
            variante={plan?.destacado ? "claro" : "suave"}
            tamano="sm"
            onClick={() => setAbierto(true)}
          >
            <Pencil size={13} />
            Editar
          </Boton>
          <Boton
            variante="fantasma"
            tamano="sm"
            disabled={borrando}
            className={
              plan?.destacado
                ? "text-white hover:bg-white/20"
                : "text-rose-600 hover:bg-rose-50"
            }
            onClick={async () => {
              setBorrando(true);
              try {
                await borrarPlan(plan!.id);
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
        titulo={modo === "crear" ? "Nuevo plan" : "Editar plan"}
        descripcion="Estos planes son los que ven tus clientas al suscribirse."
      >
        <form action={enviar} className="space-y-5">
          {plan && <input type="hidden" name="id" value={plan.id} />}
          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          <div className="grid gap-5 sm:grid-cols-3">
            <Campo etiqueta="Nombre" htmlFor="nombre" className="sm:col-span-2">
              <Entrada
                id="nombre"
                name="nombre"
                defaultValue={plan?.nombre ?? ""}
                placeholder="Transformación"
                required
              />
            </Campo>
            <Campo etiqueta="Precio mensual (USD)" htmlFor="precio_mensual">
              <Entrada
                id="precio_mensual"
                name="precio_mensual"
                type="number"
                step="0.01"
                min="0"
                defaultValue={plan?.precio_mensual ?? ""}
                placeholder="69"
                required
              />
            </Campo>
          </div>

          <Campo etiqueta="Descripción" htmlFor="descripcion">
            <AreaTexto
              id="descripcion"
              name="descripcion"
              className="min-h-20"
              defaultValue={plan?.descripcion ?? ""}
              placeholder="Para quién es este plan…"
            />
          </Campo>

          <Campo
            etiqueta="Beneficios"
            htmlFor="beneficios"
            ayuda="Uno por línea."
          >
            <AreaTexto
              id="beneficios"
              name="beneficios"
              className="min-h-32"
              defaultValue={plan?.beneficios.join("\n") ?? ""}
              placeholder={"Rutina personalizada\nPlan de nutrición\nChat directo"}
            />
          </Campo>

          <Campo
            etiqueta="ID del plan en PayPal"
            htmlFor="paypal_plan_id"
            ayuda="Créalo en PayPal → Subscriptions → Plans. Sin esto no se puede cobrar."
          >
            <Entrada
              id="paypal_plan_id"
              name="paypal_plan_id"
              defaultValue={plan?.paypal_plan_id ?? ""}
              placeholder="P-5ML4271244454362XMQIZHI"
            />
          </Campo>

          <div className="grid gap-5 sm:grid-cols-3">
            <Campo etiqueta="Orden" htmlFor="orden">
              <Entrada
                id="orden"
                name="orden"
                type="number"
                defaultValue={plan?.orden ?? 0}
              />
            </Campo>

            <label className="flex cursor-pointer items-center gap-3 pt-7 text-sm font-light text-violeta-900/75">
              <input
                type="checkbox"
                name="destacado"
                defaultChecked={plan?.destacado ?? false}
                className="h-4 w-4 accent-violeta-500"
              />
              Destacado
            </label>

            <label className="flex cursor-pointer items-center gap-3 pt-7 text-sm font-light text-violeta-900/75">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={plan?.activo ?? true}
                className="h-4 w-4 accent-violeta-500"
              />
              Visible para clientas
            </label>
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
