"use client";

import { useState } from "react";
import { Flame, Loader2, Salad, Sparkles, UtensilsCrossed } from "lucide-react";
import { asignarPlanAlimentacion } from "./acciones-asignar";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { useAccionFormulario } from "@/lib/formularios";
import type { PlanDelCatalogo } from "@/lib/catalogo";
import type { ClienteConSugerencia } from "@/lib/dietas";

export function CatalogoDietas({
  planes,
  clientes,
  hoy,
  clientePreseleccionado,
}: {
  planes: PlanDelCatalogo[];
  clientes: ClienteConSugerencia[];
  hoy: string;
  clientePreseleccionado?: string;
}) {
  const [elegido, setElegido] = useState<PlanDelCatalogo | null>(null);

  if (planes.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-[11px] tracking-[0.2em] text-violeta-500 uppercase">
        Alimentación
      </h2>
      <p className="mt-1.5 mb-6 text-sm font-light text-violeta-900/55">
        Planes de 7 días con todas las comidas armadas. Las cantidades se
        ajustan solas a las calorías de cada chica.
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {planes.map((p) => (
          <article
            key={p.id}
            className="flex flex-col rounded-4xl border border-lila-200 bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:border-lila-400 hover:shadow-elevada"
          >
            <span className="text-3xl">{p.emoji}</span>
            <h3 className="mt-3 text-xl font-medium text-violeta-800">{p.nombre}</h3>
            <p className="mt-1 text-xs font-light text-violeta-900/55">{p.resumen}</p>

            <dl className="mt-6 space-y-2 text-xs font-light text-violeta-900/60">
              <div className="flex items-center gap-2">
                <Flame size={13} className="shrink-0 text-lila-400" />
                {p.calorias_base} kcal de referencia
              </div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={13} className="shrink-0 text-lila-400" />
                {p.totalComidas} comidas en 7 días
              </div>
            </dl>

            <div className="mt-5 grid grid-cols-3 gap-1.5 border-t border-lila-100 pt-5 text-center">
              <Macro etiqueta="Prot." valor={p.proteina_objetivo_g} />
              <Macro etiqueta="Carbos" valor={p.carbohidratos_objetivo_g} />
              <Macro etiqueta="Grasa" valor={p.grasa_objetivo_g} />
            </div>

            {/* `mt-auto` clava el botón al fondo de la tarjeta: sin esto,
                los nombres que ocupan dos líneas empujaban su botón más abajo
                que el de las demás y la fila quedaba en escalera. */}
            <div className="mt-auto pt-7">
              <Boton className="w-full" onClick={() => setElegido(p)}>
                <Sparkles size={15} />
                Asignar
              </Boton>
            </div>
          </article>
        ))}
      </div>

      <DialogoAsignarDieta
        plan={elegido}
        clientes={clientes}
        hoy={hoy}
        clientePreseleccionado={clientePreseleccionado}
        alCerrar={() => setElegido(null)}
      />
    </section>
  );
}

function Macro({ etiqueta, valor }: { etiqueta: string; valor: number | null }) {
  return (
    // `min-w-0` deja que la columna se encoja dentro de la rejilla; sin él la
    // pastilla conserva el ancho de su texto y se salía del cajón. La etiqueta
    // va abreviada porque «PROTEÍNA» entera no cabe en un tercio de tarjeta
    // —ni en escritorio a cuatro columnas, ni en un móvil estrecho—.
    <div className="min-w-0 rounded-2xl bg-lila-50 px-1 py-2.5">
      <p className="truncate text-[9px] tracking-[0.04em] text-violeta-500 uppercase">
        {etiqueta}
      </p>
      <p className="mt-0.5 text-sm font-medium text-violeta-800">{valor ?? "—"}g</p>
    </div>
  );
}

function DialogoAsignarDieta({
  plan,
  clientes,
  hoy,
  clientePreseleccionado,
  alCerrar,
}: {
  plan: PlanDelCatalogo | null;
  clientes: ClienteConSugerencia[];
  hoy: string;
  clientePreseleccionado?: string;
  alCerrar: () => void;
}) {
  const { estado, enviar, pendiente } = useAccionFormulario(asignarPlanAlimentacion);
  const [clienteId, setClienteId] = useState(clientePreseleccionado ?? "");

  const elegida = clientes.find((c) => c.id === clienteId);

  return (
    <Dialogo
      abierto={plan !== null}
      alCerrar={alCerrar}
      ancho="max-w-lg"
      titulo={plan ? `${plan.emoji} ${plan.nombre}` : ""}
      descripcion={plan?.resumen ?? undefined}
    >
      {plan && (
        <form action={enviar} className="space-y-5">
          <input type="hidden" name="plan_id" value={plan.id} />

          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          {clientes.length === 0 ? (
            <Aviso tono="info">
              Todavía no tienes clientas registradas.
            </Aviso>
          ) : (
            <>
              <Campo etiqueta="Para quién" htmlFor="dieta_cliente_id">
                <Seleccion
                  id="dieta_cliente_id"
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

              {clienteId && !elegida?.sugerencia && (
                <Aviso tono="info">
                  No puedo proponer calorías porque faltan datos de esta clienta:{" "}
                  {elegida?.faltan.join(", ")}. Escribe el objetivo a mano o
                  completa su evaluación primero.
                </Aviso>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* La clave reinicia el campo al cambiar de clienta, para que
                    tome su propuesta sin necesidad de un efecto. */}
                <Campo etiqueta="Calorías al día" htmlFor="calorias_objetivo">
                  <Entrada
                    key={clienteId}
                    id="calorias_objetivo"
                    name="calorias_objetivo"
                    type="number"
                    min="800"
                    max="6000"
                    required
                    // Sin una sugerencia real, se deja vacío para que la
                    // entrenadora escriba el número a propósito —antes caía
                    // en `plan.calorias_base` (el de referencia de la
                    // plantilla) y parecía un cálculo hecho para esta
                    // clienta cuando no lo era.
                    placeholder={
                      elegida?.sugerencia ? undefined : String(plan.calorias_base)
                    }
                    defaultValue={
                      elegida?.sugerencia ? String(elegida.sugerencia.calorias) : ""
                    }
                  />
                </Campo>
                <Campo etiqueta="Empieza el" htmlFor="dieta_fecha_inicio">
                  <Entrada
                    id="dieta_fecha_inicio"
                    name="fecha_inicio"
                    type="date"
                    defaultValue={hoy}
                  />
                </Campo>
              </div>

              <p className="flex gap-3 rounded-2xl border border-lila-200 bg-lila-50/60 px-5 py-3 text-xs leading-relaxed font-light text-violeta-900/65">
                <Salad size={15} className="mt-0.5 shrink-0 text-lila-400" />
                <span>
                  El plan está escrito para {plan.calorias_base} kcal. Al
                  asignarlo se le recalculan todas las cantidades a las calorías
                  que pongas aquí.
                </span>
              </p>

              <Boton type="submit" tamano="lg" className="w-full" disabled={pendiente}>
                {pendiente && <Loader2 size={16} className="animate-spin" />}
                {pendiente ? "Asignando…" : "Asignar plan"}
              </Boton>
            </>
          )}
        </form>
      )}
    </Dialogo>
  );
}
