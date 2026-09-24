"use client";

import { useState, useTransition } from "react";
import { Check, Circle, Clock, Loader2 } from "lucide-react";
import { marcarComida } from "./acciones";
import { ResumenMacros } from "@/components/panel/macros";
import { redondear, textoCantidad } from "@/lib/nutricion";
import { cn } from "@/lib/utils";
import type { DiaConComidas, PlanCompleto } from "@/lib/dietas";

export function VistaAlimentacion({
  contenido,
  diaDeHoy,
  cumplidas,
}: {
  contenido: PlanCompleto;
  /** 1 = lunes … 7 = domingo */
  diaDeHoy: number;
  /** Ids de las comidas que ya marcó hoy. */
  cumplidas: string[];
}) {
  const { plan, dias } = contenido;
  const hoy = dias.find((d) => d.numero === diaDeHoy) ?? dias[0];
  const [diaActivo, setDiaActivo] = useState(hoy?.id ?? "");
  const dia = dias.find((d) => d.id === diaActivo) ?? hoy;

  const esHoy = dia?.numero === diaDeHoy;
  const [marcadas, setMarcadas] = useState<string[]>(cumplidas);

  const macrosCumplidos = dia
    ? dia.comidas
        .filter((c) => esHoy && marcadas.includes(c.id))
        .reduce(
          (t, c) => ({
            calorias: t.calorias + c.macros.calorias,
            proteina: t.proteina + c.macros.proteina,
            carbohidratos: t.carbohidratos + c.macros.carbohidratos,
            grasa: t.grasa + c.macros.grasa,
            fibra: t.fibra + c.macros.fibra,
          }),
          { calorias: 0, proteina: 0, carbohidratos: 0, grasa: 0, fibra: 0 }
        )
    : null;

  const objetivos = {
    calorias: plan.calorias_objetivo,
    proteina: plan.proteina_objetivo_g,
    carbohidratos: plan.carbohidratos_objetivo_g,
    grasa: plan.grasa_objetivo_g,
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap gap-2">
          {dias.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDiaActivo(d.id)}
              className={cn(
                "cursor-pointer rounded-2xl px-4 py-2.5 text-left transition-all duration-300",
                d.id === dia?.id
                  ? "fondo-degradado text-white shadow-suave"
                  : "border border-lila-200 bg-white text-violeta-800 hover:border-lila-400"
              )}
            >
              <span className="block text-sm font-medium">
                {d.nombre}
                {d.numero === diaDeHoy && (
                  <span
                    className={cn(
                      "ml-1.5 text-[10px]",
                      d.id === dia?.id ? "text-lila-100" : "text-violeta-500"
                    )}
                  >
                    hoy
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "block text-[11px] font-light",
                  d.id === dia?.id ? "text-lila-100" : "text-violeta-900/45"
                )}
              >
                {Math.round(d.macros.calorias)} kcal
              </span>
            </button>
          ))}
        </div>

        {dia && dia.comidas.length > 0 ? (
          <div className="space-y-4">
            {dia.comidas.map((comida) => (
              <Comida
                key={comida.id}
                comida={comida}
                marcable={esHoy}
                marcada={marcadas.includes(comida.id)}
                alMarcar={(v) =>
                  setMarcadas((m) =>
                    v ? [...m, comida.id] : m.filter((x) => x !== comida.id)
                  )
                }
              />
            ))}
          </div>
        ) : (
          <p className="rounded-4xl border border-dashed border-lila-300 px-6 py-14 text-center text-sm font-light text-violeta-900/45">
            Este día todavía no tiene comidas asignadas.
          </p>
        )}
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <ResumenMacros
          macros={dia?.macros ?? { calorias: 0, proteina: 0, carbohidratos: 0, grasa: 0, fibra: 0 }}
          objetivos={objetivos}
        />

        {esHoy && macrosCumplidos && (
          <div className="mt-4 rounded-4xl border border-lila-200 bg-white p-6">
            <p className="text-[10px] tracking-[0.2em] text-violeta-500 uppercase">
              Ya cumplido hoy
            </p>
            <p className="mt-2 text-2xl font-light text-violeta-800">
              {Math.round(macrosCumplidos.calorias)}
              <span className="ml-1 text-sm text-violeta-900/40">
                de {Math.round(dia!.macros.calorias)} kcal
              </span>
            </p>
            <p className="mt-2 text-xs font-light text-violeta-900/55">
              {marcadas.length} de {dia!.comidas.length} comidas marcadas
            </p>
          </div>
        )}

        <p className="mt-4 px-2 text-[11px] leading-relaxed font-light text-violeta-900/45">
          Marca cada comida cuando la hagas. Yiyo ve tu seguimiento y puede
          ajustar el plan si hace falta.
        </p>
      </aside>
    </div>
  );
}

function Comida({
  comida,
  marcable,
  marcada,
  alMarcar,
}: {
  comida: DiaConComidas["comidas"][number];
  marcable: boolean;
  marcada: boolean;
  alMarcar: (valor: boolean) => void;
}) {
  const [guardando, iniciar] = useTransition();
  const [fallo, setFallo] = useState(false);
  const m = redondear(comida.macros);

  return (
    <section
      className={cn(
        "rounded-4xl border bg-white p-6 shadow-suave transition-colors",
        marcada ? "border-emerald-300 bg-emerald-50/40" : "border-lila-200"
      )}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-violeta-800">{comida.nombre}</h3>
          {comida.hora && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-light text-violeta-900/45">
              <Clock size={11} />
              {comida.hora.slice(0, 5)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs font-light text-violeta-900/60">
            <span className="font-medium text-violeta-700">{m.calorias} kcal</span>
            {" · "}P {m.proteina} · C {m.carbohidratos} · G {m.grasa}
          </p>

          {marcable && (
            <button
              type="button"
              disabled={guardando}
              onClick={() => {
                const nuevo = !marcada;
                alMarcar(nuevo);
                setFallo(false);
                iniciar(async () => {
                  const r = await marcarComida(comida.id, nuevo);
                  // Sin avisar del fallo, la marca volvia atras sola y
                  // parecia que el boton no funcionaba.
                  if (r.error) {
                    alMarcar(!nuevo);
                    setFallo(true);
                  }
                });
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors",
                fallo
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : marcada
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-lila-100 text-violeta-700 hover:bg-lila-200"
              )}
            >
              {guardando ? (
                <Loader2 size={13} className="animate-spin" />
              ) : marcada ? (
                <Check size={13} />
              ) : (
                <Circle size={13} />
              )}
              {fallo ? "Reintentar" : marcada ? "Cumplida" : "Marcar"}
            </button>
          )}
        </div>
      </header>

      {comida.ingredientes.length > 0 ? (
        <ul className="space-y-2">
          {comida.ingredientes.map((ing) => (
            <li
              key={ing.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-lila-50 px-4 py-3"
            >
              <span className="text-sm text-violeta-800">{ing.alimento.nombre}</span>
              <span className="text-xs font-light text-violeta-900/55">
                {textoCantidad(ing.alimento, Number(ing.cantidad))}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs font-light text-violeta-900/45">
          Sin alimentos asignados.
        </p>
      )}
    </section>
  );
}
