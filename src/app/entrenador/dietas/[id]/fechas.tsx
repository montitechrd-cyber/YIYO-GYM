"use client";

import { useState } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import { actualizarFechasPlan } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import { FECHA_LARGA, fechaLocal } from "@/lib/etiquetas";
import type { PlanAlimentacion } from "@/lib/supabase/tipos";

/** Mismo cálculo que el calendario: el día de inicio cuenta como primero. */
function finDe(inicio: string, semanas: number) {
  const f = new Date(inicio + "T00:00:00");
  f.setDate(f.getDate() + semanas * 7 - 1);
  const m = String(f.getMonth() + 1).padStart(2, "0");
  const d = String(f.getDate()).padStart(2, "0");
  return `${f.getFullYear()}-${m}-${d}`;
}

/**
 * Cuándo empieza el plan y cuántas semanas dura.
 *
 * El final no se pide: se enseña calculado mientras se escribe. Pedir las
 * dos fechas deja escribir un fin anterior al inicio, y además obliga a
 * contar semanas a mano, que es justo lo que la máquina hace bien.
 */
export function EditorFechas({ plan }: { plan: PlanAlimentacion }) {
  const [abierto, setAbierto] = useState(false);
  const [inicio, setInicio] = useState(plan.inicio);
  const [semanas, setSemanas] = useState(plan.semanas ?? 4);
  const { estado, enviar, pendiente } = useAccionFormulario(
    actualizarFechasPlan,
    () => setAbierto(false)
  );

  const fin = plan.semanas ? finDe(plan.inicio, plan.semanas) : null;
  const finPrevisto =
    inicio && semanas >= 1 && semanas <= 52 ? finDe(inicio, semanas) : null;

  return (
    <>
      <Boton variante="contorno" tamano="sm" onClick={() => setAbierto(true)}>
        <CalendarRange size={14} />
        {fin
          ? `${FECHA_LARGA.format(fechaLocal(plan.inicio))} → ${FECHA_LARGA.format(fechaLocal(fin))}`
          : "Fijar fechas"}
      </Boton>

      <Dialogo
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Cuándo empieza y cuánto dura"
        descripcion="El calendario de la clienta se ajusta solo a lo que pongas aquí"
        ancho="max-w-xl"
      >
        <form action={enviar} className="space-y-5">
          <input type="hidden" name="plan_id" value={plan.id} />
          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Empieza el" htmlFor="inicio">
              <Entrada
                id="inicio"
                name="inicio"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                required
              />
            </Campo>
            <Campo etiqueta="Durante (semanas)" htmlFor="semanas">
              <Entrada
                id="semanas"
                name="semanas"
                type="number"
                min="1"
                max="52"
                value={semanas}
                onChange={(e) => setSemanas(Number(e.target.value))}
                required
              />
            </Campo>
          </div>

          {finPrevisto && (
            <p className="rounded-3xl bg-lila-50 px-5 py-4 text-sm font-light text-violeta-900/70">
              Termina el{" "}
              <strong className="font-medium text-violeta-800">
                {FECHA_LARGA.format(fechaLocal(finPrevisto))}
              </strong>
              , el último día que le aparecerá en su calendario.
            </p>
          )}

          <div className="flex gap-3">
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
