"use client";

import { useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { crearPlanAlimentacion } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { useAccionFormulario } from "@/lib/formularios";
import type { Sugerencia } from "@/lib/nutricion";
import type { ClienteParaDieta } from "./page";

export function FormularioDieta({
  clientes,
  clientePreseleccionado,
}: {
  clientes: ClienteParaDieta[];
  clientePreseleccionado?: string;
}) {
  const [clienteId, setClienteId] = useState(clientePreseleccionado ?? "");
  const { estado, enviar, pendiente } = useAccionFormulario(crearPlanAlimentacion);

  const elegida = clientes.find((c) => c.id === clienteId);
  const s = elegida?.sugerencia ?? null;

  return (
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

      <Campo etiqueta="Nombre del plan" htmlFor="nombre">
        <Entrada
          id="nombre"
          name="nombre"
          placeholder="Definición — Fase 1"
          required
        />
      </Campo>

      <Campo etiqueta="Descripción" htmlFor="descripcion">
        <AreaTexto
          id="descripcion"
          name="descripcion"
          className="min-h-20"
          placeholder="Enfoque del plan, indicaciones generales…"
        />
      </Campo>

      {clienteId && (
        <div className="rounded-3xl border border-lila-200 bg-lila-50/60 p-5">
          <p className="mb-1 flex items-center gap-2 text-[11px] tracking-[0.18em] text-violeta-500 uppercase">
            <Calculator size={13} />
            Objetivo diario
          </p>

          {s ? (
            <p className="mb-4 text-xs leading-relaxed font-light text-violeta-900/60">
              Propuesta a partir de sus datos: gasto basal {s.gastoBasal} kcal,
              gasto total estimado {s.gastoTotal} kcal. Es una referencia
              orientativa — ajústala con tu criterio.
            </p>
          ) : (
            <Aviso tono="info" className="mb-4">
              No puedo proponer calorías porque faltan datos de esta clienta:{" "}
              {elegida?.faltan.join(", ")}. Puedes escribir el objetivo a mano o
              completar su evaluación primero.
            </Aviso>
          )}

          {/* La clave reinicia los campos al cambiar de clienta, para que se
              rellenen con su propuesta sin necesidad de un efecto. */}
          <CamposObjetivo key={clienteId} sugerencia={s} />
        </div>
      )}

      <Boton type="submit" tamano="lg" disabled={pendiente}>
        {pendiente && <Loader2 size={16} className="animate-spin" />}
        {pendiente ? "Creando…" : "Crear dieta"}
      </Boton>
    </form>
  );
}

function CamposObjetivo({ sugerencia }: { sugerencia: Sugerencia | null }) {
  const [valores, setValores] = useState({
    calorias_objetivo: sugerencia ? String(sugerencia.calorias) : "",
    proteina_objetivo_g: sugerencia ? String(sugerencia.proteina) : "",
    carbohidratos_objetivo_g: sugerencia ? String(sugerencia.carbohidratos) : "",
    grasa_objetivo_g: sugerencia ? String(sugerencia.grasa) : "",
  });

  const campos = [
    { n: "calorias_objetivo", e: "Calorías" },
    { n: "proteina_objetivo_g", e: "Proteína (g)" },
    { n: "carbohidratos_objetivo_g", e: "Carbos (g)" },
    { n: "grasa_objetivo_g", e: "Grasa (g)" },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {campos.map((c) => (
        <Campo key={c.n} etiqueta={c.e} htmlFor={c.n}>
          <Entrada
            id={c.n}
            name={c.n}
            type="number"
            min="0"
            value={valores[c.n]}
            onChange={(e) =>
              setValores((v) => ({ ...v, [c.n]: e.target.value }))
            }
            placeholder="—"
            className="bg-white"
          />
        </Campo>
      ))}
    </div>
  );
}
