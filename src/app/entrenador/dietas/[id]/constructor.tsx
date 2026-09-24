"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Loader2,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import {
  agregarComida,
  agregarIngrediente,
  borrarComida,
  cambiarCantidad,
  copiarDia,
  quitarIngrediente,
  renombrarComida,
} from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { ResumenMacros } from "@/components/panel/macros";
import {
  CATEGORIAS_ALIMENTO,
  macrosDe,
  redondear,
  textoCantidad,
} from "@/lib/nutricion";
import { cn } from "@/lib/utils";
import type { DiaConComidas, PlanCompleto } from "@/lib/dietas";
import type { Alimento } from "@/lib/supabase/tipos";

export function ConstructorDieta({
  contenido,
  alimentos,
}: {
  contenido: PlanCompleto;
  alimentos: Alimento[];
}) {
  const { plan, dias } = contenido;
  const [diaActivo, setDiaActivo] = useState(dias[0]?.id ?? "");
  const dia = dias.find((d) => d.id === diaActivo) ?? dias[0];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        {/* Selector de día */}
        <div className="mb-5 flex flex-wrap gap-2">
          {dias.map((d) => {
            const kcal = Math.round(d.macros.calorias);
            return (
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
                <span className="block text-sm font-medium">{d.nombre}</span>
                <span
                  className={cn(
                    "block text-[11px] font-light",
                    d.id === dia?.id ? "text-lila-100" : "text-violeta-900/45"
                  )}
                >
                  {kcal > 0 ? `${kcal} kcal` : "vacío"}
                </span>
              </button>
            );
          })}
        </div>

        {dia && (
          <DiaDeDieta
            dia={dia}
            dias={dias}
            planId={plan.id}
            alimentos={alimentos}
          />
        )}
      </div>

      {/* Resumen del día, siempre a la vista */}
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <ResumenMacros
          macros={dia?.macros ?? { calorias: 0, proteina: 0, carbohidratos: 0, grasa: 0, fibra: 0 }}
          objetivos={{
            calorias: plan.calorias_objetivo,
            proteina: plan.proteina_objetivo_g,
            carbohidratos: plan.carbohidratos_objetivo_g,
            grasa: plan.grasa_objetivo_g,
          }}
        />
        <p className="mt-4 px-2 text-[11px] leading-relaxed font-light text-violeta-900/45">
          Los macros se calculan sumando los alimentos de cada comida. Si cambias
          una cantidad, el total se actualiza solo.
        </p>
      </aside>
    </div>
  );
}

function DiaDeDieta({
  dia,
  dias,
  planId,
  alimentos,
}: {
  dia: DiaConComidas;
  dias: DiaConComidas[];
  planId: string;
  alimentos: Alimento[];
}) {
  const [enCurso, iniciar] = useTransition();
  const [origenCopia, setOrigenCopia] = useState("");
  const [aviso, setAviso] = useState<{ error?: string; exito?: string }>({});

  return (
    <div className="space-y-4">
      {aviso.error && <Aviso tono="error">{aviso.error}</Aviso>}
      {aviso.exito && <Aviso tono="exito">{aviso.exito}</Aviso>}

      {dia.comidas.map((comida) => (
        <ComidaEditable
          key={comida.id}
          comida={comida}
          planId={planId}
          alimentos={alimentos}
        />
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Boton
          variante="contorno"
          tamano="sm"
          disabled={enCurso}
          onClick={() => iniciar(async () => void (await agregarComida(dia.id, planId)))}
        >
          <Plus size={14} />
          Añadir comida
        </Boton>

        <div className="flex items-center gap-2">
          <Seleccion
            value={origenCopia}
            onChange={(e) => setOrigenCopia(e.target.value)}
            className="w-44 px-3 py-2 text-sm"
          >
            <option value="">Copiar desde…</option>
            {dias
              .filter((d) => d.id !== dia.id && d.comidas.length > 0)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
          </Seleccion>
          <Boton
            variante="fantasma"
            tamano="sm"
            disabled={!origenCopia || enCurso}
            onClick={() =>
              iniciar(async () => {
                const r = await copiarDia(origenCopia, dia.id, planId);
                setAviso(r);
              })
            }
          >
            <Copy size={13} />
            Copiar
          </Boton>
        </div>
      </div>
    </div>
  );
}

function ComidaEditable({
  comida,
  planId,
  alimentos,
}: {
  comida: DiaConComidas["comidas"][number];
  planId: string;
  alimentos: Alimento[];
}) {
  const [enCurso, iniciar] = useTransition();
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombre, setNombre] = useState(comida.nombre);
  const [hora, setHora] = useState(comida.hora?.slice(0, 5) ?? "");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [elegido, setElegido] = useState<Alimento | null>(null);
  const [cantidad, setCantidad] = useState("100");
  const [error, setError] = useState<string | null>(null);

  const m = redondear(comida.macros);

  // Sin límite: antes se cortaba en 6 resultados sin avisar, así que un
  // alimento del catálogo podía quedar imposible de encontrar solo por el
  // orden alfabético. El panel de resultados se desplaza en su lugar.
  const candidatos = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    return alimentos
      .filter((a) => !categoria || a.categoria === categoria)
      .filter((a) => !t || a.nombre.toLowerCase().includes(t));
  }, [alimentos, busqueda, categoria]);

  const anadir = (alimento: Alimento) => {
    const n = Number(cantidad);
    if (!n || n <= 0) {
      setError("Indica una cantidad válida.");
      return;
    }
    const datos = new FormData();
    datos.set("comida_id", comida.id);
    datos.set("plan_id", planId);
    datos.set("alimento_id", alimento.id);
    datos.set("cantidad", String(n));
    iniciar(async () => {
      const r = await agregarIngrediente({}, datos);
      setError(r.error ?? null);
      if (!r.error) {
        setBusqueda("");
        setElegido(null);
      }
    });
  };

  return (
    <section className="rounded-4xl border border-lila-200 bg-white p-6 shadow-suave">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {editandoNombre ? (
          <div className="flex flex-wrap items-center gap-2">
            <Entrada
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-48 px-3 py-2 text-sm"
            />
            <Entrada
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-32 px-3 py-2 text-sm"
            />
            <Boton
              tamano="sm"
              disabled={enCurso}
              onClick={() =>
                iniciar(async () => {
                  await renombrarComida(comida.id, planId, nombre, hora);
                  setEditandoNombre(false);
                })
              }
            >
              <Check size={13} />
              Listo
            </Boton>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditandoNombre(true)}
            className="cursor-pointer text-left"
          >
            <h3 className="font-medium text-violeta-800">{comida.nombre}</h3>
            <p className="mt-0.5 text-[11px] font-light text-violeta-900/45">
              {comida.hora ? comida.hora.slice(0, 5) : "sin hora"} · toca para
              renombrar
            </p>
          </button>
        )}

        <div className="flex items-center gap-3">
          <p className="text-xs font-light text-violeta-900/60">
            <span className="font-medium text-violeta-700">{m.calorias} kcal</span>
            {" · "}P {m.proteina} · C {m.carbohidratos} · G {m.grasa}
          </p>
          <button
            type="button"
            aria-label="Eliminar comida"
            disabled={enCurso}
            onClick={() => iniciar(async () => void (await borrarComida(comida.id, planId)))}
            className="cursor-pointer rounded-xl p-2 text-violeta-900/30 transition-colors hover:bg-rose-100 hover:text-rose-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {comida.ingredientes.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {comida.ingredientes.map((ing) => {
            const im = redondear(macrosDe(ing.alimento, Number(ing.cantidad)));
            return (
              <li
                key={ing.id}
                className="flex flex-wrap items-center gap-3 rounded-3xl bg-lila-50 px-4 py-3"
              >
                <span className="min-w-40 flex-1 text-sm text-violeta-800">
                  {ing.alimento.nombre}
                </span>

                <label className="flex items-center gap-2 text-[11px] text-violeta-900/50">
                  <Entrada
                    type="number"
                    min="1"
                    step={ing.alimento.unidad === "unidad" ? "0.5" : "1"}
                    defaultValue={Number(ing.cantidad)}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (n > 0 && n !== Number(ing.cantidad)) {
                        cambiarCantidad(ing.id, planId, n);
                      }
                    }}
                    className="w-20 bg-white px-2 py-1.5 text-center text-sm"
                  />
                  {ing.alimento.unidad === "unidad" ? "uds" : ing.alimento.unidad}
                </label>

                <span className="text-[11px] font-light text-violeta-900/55">
                  {im.calorias} kcal · P {im.proteina} · C {im.carbohidratos} · G{" "}
                  {im.grasa}
                </span>

                <button
                  type="button"
                  aria-label={`Quitar ${ing.alimento.nombre}`}
                  onClick={() => quitarIngrediente(ing.id, planId)}
                  className="cursor-pointer rounded-xl p-1.5 text-violeta-900/25 transition-colors hover:bg-rose-100 hover:text-rose-600"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-4 rounded-3xl border border-dashed border-lila-300 px-4 py-6 text-center text-xs font-light text-violeta-900/45">
          Sin alimentos todavía.
        </p>
      )}

      {/* Alta rápida de ingredientes */}
      <div className="rounded-3xl bg-lila-50/70 p-4">
        {error && (
          <Aviso tono="error" className="mb-3">
            {error}
          </Aviso>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-44 flex-1">
            <Search
              size={14}
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-violeta-400"
            />
            <Entrada
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar alimento…"
              className="bg-white py-2 pl-9 text-sm"
            />
          </div>
          <Seleccion
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-36 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {Object.entries(CATEGORIAS_ALIMENTO).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </Seleccion>
          <label className="text-[10px] tracking-widest text-violeta-500 uppercase">
            <span className="mb-1 block">Cantidad</span>
            <Entrada
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-24 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <p className="mt-3 text-[10px] tracking-widest text-violeta-500 uppercase">
          {candidatos.length} alimento{candidatos.length === 1 ? "" : "s"} del
          catálogo
        </p>
        <div className="mt-2 flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-2xl">
          {candidatos.map((a) => {
            const previo = redondear(macrosDe(a, Number(cantidad) || 0));
            return (
              <button
                key={a.id}
                type="button"
                disabled={enCurso}
                onClick={() => anadir(a)}
                onMouseEnter={() => setElegido(a)}
                className="flex h-fit cursor-pointer items-center gap-2 rounded-full border border-lila-300 bg-white px-3.5 py-2 text-xs text-violeta-800 transition-all hover:border-violeta-500 hover:shadow-suave disabled:opacity-50"
              >
                <Plus size={12} className="text-violeta-500" />
                {a.nombre}
                <span className="text-violeta-900/40">{previo.calorias} kcal</span>
              </button>
            );
          })}
          {candidatos.length === 0 && (
            <p className="text-xs font-light text-violeta-900/45">
              Ningún alimento coincide. Añádelo en la sección Alimentos.
            </p>
          )}
        </div>

        {elegido && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-light text-violeta-900/45">
            <UtensilsCrossed size={11} />
            {textoCantidad(elegido, Number(cantidad) || 0)} de {elegido.nombre} ={" "}
            {redondear(macrosDe(elegido, Number(cantidad) || 0)).calorias} kcal
          </p>
        )}
      </div>

      {enCurso && (
        <p className="mt-3 flex items-center gap-2 text-xs font-light text-violeta-600">
          <Loader2 size={13} className="animate-spin" />
          Guardando…
        </p>
      )}
    </section>
  );
}
