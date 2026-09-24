"use client";

import { useState } from "react";
import { Loader2, Target } from "lucide-react";
import { actualizarObjetivos } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import type { PlanAlimentacion } from "@/lib/supabase/tipos";

export function EditorObjetivos({ plan }: { plan: PlanAlimentacion }) {
  const [abierto, setAbierto] = useState(false);
  const { estado, enviar, pendiente } = useAccionFormulario(
    actualizarObjetivos,
    () => setAbierto(false)
  );

  return (
    <>
      <Boton variante="contorno" tamano="sm" onClick={() => setAbierto(true)}>
        <Target size={14} />
        {plan.calorias_objetivo
          ? `${plan.calorias_objetivo} kcal/día`
          : "Fijar objetivo"}
      </Boton>

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Objetivo diario"
        descripcion="Las barras del plan se comparan contra estos valores."
        ancho="max-w-xl"
      >
        <form action={enviar} className="space-y-5">
          <input type="hidden" name="plan_id" value={plan.id} />
          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { n: "calorias_objetivo", e: "Calorías", v: plan.calorias_objetivo },
              {
                n: "proteina_objetivo_g",
                e: "Proteína (g)",
                v: plan.proteina_objetivo_g,
              },
              {
                n: "carbohidratos_objetivo_g",
                e: "Carbos (g)",
                v: plan.carbohidratos_objetivo_g,
              },
              { n: "grasa_objetivo_g", e: "Grasa (g)", v: plan.grasa_objetivo_g },
            ].map((c) => (
              <Campo key={c.n} etiqueta={c.e} htmlFor={c.n}>
                <Entrada
                  id={c.n}
                  name={c.n}
                  type="number"
                  min="0"
                  defaultValue={c.v ?? ""}
                  placeholder="—"
                />
              </Campo>
            ))}
          </div>

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
