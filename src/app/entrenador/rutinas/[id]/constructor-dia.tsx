"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Check,
  Clock,
  Layers,
  Loader2,
  Plus,
  Search,
  Timer,
  Type,
  Ungroup,
} from "lucide-react";
import { guardarBloquesDelDia } from "../acciones";
import {
  bloqueDescanso,
  bloqueEjercicio,
  bloqueEtiqueta,
  duracionEstimada,
  formatearDuracion,
  normalizarGrupos,
  type Bloque,
} from "@/lib/bloques";
import { GRUPOS } from "@/lib/etiquetas";
import { Boton } from "@/components/ui/boton";
import { Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { FilaBloque } from "./bloque";
import { cn } from "@/lib/utils";
import type { Ejercicio } from "@/lib/supabase/tipos";

const DESCANSOS = [15, 30, 45, 60, 90, 120, 180];

export function ConstructorDia({
  diaId,
  rutinaId,
  nombreDia,
  bloquesIniciales,
  ejercicios,
}: {
  diaId: string;
  rutinaId: string;
  nombreDia: string;
  bloquesIniciales: Bloque[];
  ejercicios: Ejercicio[];
}) {
  const [bloques, setBloques] = useState<Bloque[]>(bloquesIniciales);
  const [guardado, setGuardado] = useState<Bloque[]>(bloquesIniciales);
  const [estado, setEstado] = useState<{ error?: string; exito?: string }>({});
  const [guardando, iniciarGuardado] = useTransition();

  // Barra de alta rápida
  const [busqueda, setBusqueda] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [series, setSeries] = useState(3);
  const [repeticiones, setRepeticiones] = useState("10");
  const [descanso, setDescanso] = useState(60);

  const [editando, setEditando] = useState<string | null>(null);
  const arrastrado = useRef<string | null>(null);
  const [arrastrandoClave, setArrastrandoClave] = useState<string | null>(null);

  const porId = useMemo(
    () => new Map(ejercicios.map((e) => [e.id, e])),
    [ejercicios]
  );

  const sinGuardar = JSON.stringify(bloques) !== JSON.stringify(guardado);
  const total = duracionEstimada(bloques);

  // Sin límite: antes se cortaba en 8 resultados sin avisar, así que un
  // ejercicio de la biblioteca podía quedar imposible de encontrar solo por
  // el orden alfabético. El panel de resultados se desplaza en su lugar.
  const candidatos = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return ejercicios
      .filter((e) => !grupoFiltro || e.grupo === grupoFiltro)
      .filter(
        (e) =>
          !texto ||
          e.nombre.toLowerCase().includes(texto) ||
          (e.equipo ?? "").toLowerCase().includes(texto)
      );
  }, [ejercicios, busqueda, grupoFiltro]);

  const cambiar = (clave: string, cambios: Partial<Bloque>) =>
    setBloques((bs) => bs.map((b) => (b.clave === clave ? { ...b, ...cambios } : b)));

  const anadir = (b: Bloque) => setBloques((bs) => [...bs, b]);

  const anadirEjercicio = (ejercicioId: string) => {
    anadir({
      ...bloqueEjercicio(ejercicioId),
      series,
      repeticiones: repeticiones.trim() || "10",
      descanso_seg: descanso,
    });
    setBusqueda("");
  };

  const duplicar = (clave: string) =>
    setBloques((bs) => {
      const i = bs.findIndex((b) => b.clave === clave);
      if (i < 0) return bs;
      const copia = { ...bs[i], clave: crypto.randomUUID() };
      return [...bs.slice(0, i + 1), copia, ...bs.slice(i + 1)];
    });

  const borrar = (clave: string) =>
    setBloques((bs) => normalizarGrupos(bs.filter((b) => b.clave !== clave)));

  const reordenar = (destino: string) => {
    const origen = arrastrado.current;
    if (!origen || origen === destino) return;
    setBloques((bs) => {
      const desde = bs.findIndex((b) => b.clave === origen);
      const hasta = bs.findIndex((b) => b.clave === destino);
      if (desde < 0 || hasta < 0) return bs;
      const copia = [...bs];
      const [movido] = copia.splice(desde, 1);
      copia.splice(hasta, 0, movido);
      return normalizarGrupos(copia);
    });
  };

  /** Agrupa en un circuito los bloques sueltos que hay al final de la lista. */
  const agruparUltimos = (cuantos: number) => {
    setBloques((bs) => {
      if (bs.length < 2) return bs;
      const desde = Math.max(0, bs.length - cuantos);
      const numero = Math.max(0, ...bs.map((b) => b.grupo ?? 0)) + 1;
      return bs.map((b, i) =>
        i >= desde ? { ...b, grupo: numero, grupo_repeticiones: 3 } : b
      );
    });
  };

  const desagrupar = (numero: number) =>
    setBloques((bs) =>
      normalizarGrupos(
        bs.map((b) =>
          b.grupo === numero ? { ...b, grupo: null, grupo_repeticiones: 1 } : b
        )
      )
    );

  const cambiarRepeticionesCircuito = (numero: number, veces: number) =>
    setBloques((bs) =>
      bs.map((b) => (b.grupo === numero ? { ...b, grupo_repeticiones: veces } : b))
    );

  const guardar = () =>
    iniciarGuardado(async () => {
      const r = await guardarBloquesDelDia(diaId, rutinaId, bloques);
      setEstado(r);
      if (!r.error) setGuardado(bloques);
    });

  // Agrupa visualmente los bloques consecutivos que comparten circuito.
  const tramos = useMemo(() => {
    const salida: { grupo: number | null; veces: number; items: Bloque[] }[] = [];
    for (const b of bloques) {
      const ultimo = salida.at(-1);
      if (ultimo && ultimo.grupo != null && ultimo.grupo === b.grupo) {
        ultimo.items.push(b);
      } else {
        salida.push({
          grupo: b.grupo,
          veces: b.grupo_repeticiones,
          items: [b],
        });
      }
    }
    return salida;
  }, [bloques]);

  return (
    <section className="rounded-4xl border border-lila-200 bg-white p-7 shadow-suave">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-violeta-800">{nombreDia}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-light text-violeta-900/55">
            <Clock size={12} />
            Tiempo estimado: {formatearDuracion(total)} · {bloques.length} bloque
            {bloques.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sinGuardar && (
            <span className="text-xs font-light text-amber-700">Sin guardar</span>
          )}
          <Boton
            tamano="sm"
            onClick={guardar}
            disabled={guardando || !sinGuardar}
          >
            {guardando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {guardando ? "Guardando…" : "Guardar día"}
          </Boton>
        </div>
      </header>

      {estado.error && (
        <Aviso tono="error" className="mb-5">
          {estado.error}
        </Aviso>
      )}

      {/* Línea de tiempo */}
      {bloques.length > 0 ? (
        <div className="space-y-2">
          {tramos.map((tramo, indice) =>
            tramo.grupo == null ? (
              <ul key={`suelto-${indice}`} className="space-y-2">
                {tramo.items.map((b) => (
                  <FilaBloque
                    key={b.clave}
                    bloque={b}
                    ejercicio={b.ejercicio_id ? porId.get(b.ejercicio_id) : null}
                    arrastrando={arrastrandoClave === b.clave}
                    alEditar={() => setEditando(editando === b.clave ? null : b.clave)}
                    alDuplicar={() => duplicar(b.clave)}
                    alBorrar={() => borrar(b.clave)}
                    alEmpezarArrastre={() => {
                      arrastrado.current = b.clave;
                      setArrastrandoClave(b.clave);
                    }}
                    alSoltarEncima={() => reordenar(b.clave)}
                    alTerminarArrastre={() => {
                      arrastrado.current = null;
                      setArrastrandoClave(null);
                    }}
                  />
                ))}
                {tramo.items.map(
                  (b) =>
                    editando === b.clave && (
                      <EditorBloque
                        key={`ed-${b.clave}`}
                        bloque={b}
                        alCambiar={(c) => cambiar(b.clave, c)}
                        alCerrar={() => setEditando(null)}
                      />
                    )
                )}
              </ul>
            ) : (
              <div
                key={`circuito-${tramo.grupo}`}
                className="rounded-4xl border-2 border-dashed border-violeta-500/35 bg-lila-50/60 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
                  <span className="flex items-center gap-2 text-[11px] tracking-[0.16em] text-violeta-600 uppercase">
                    <Layers size={13} />
                    Circuito ×{tramo.veces}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-light text-violeta-900/60">
                      Repeticiones
                    </label>
                    <Entrada
                      type="number"
                      min={1}
                      max={20}
                      value={tramo.veces}
                      onChange={(e) =>
                        cambiarRepeticionesCircuito(
                          tramo.grupo!,
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      }
                      className="w-20 px-3 py-1.5 text-sm"
                    />
                    <Boton
                      variante="fantasma"
                      tamano="sm"
                      onClick={() => desagrupar(tramo.grupo!)}
                    >
                      <Ungroup size={13} />
                      Deshacer
                    </Boton>
                  </div>
                </div>

                <ul className="space-y-2">
                  {tramo.items.map((b) => (
                    <FilaBloque
                      key={b.clave}
                      bloque={b}
                      ejercicio={b.ejercicio_id ? porId.get(b.ejercicio_id) : null}
                      arrastrando={arrastrandoClave === b.clave}
                      alEditar={() =>
                        setEditando(editando === b.clave ? null : b.clave)
                      }
                      alDuplicar={() => duplicar(b.clave)}
                      alBorrar={() => borrar(b.clave)}
                      alEmpezarArrastre={() => {
                        arrastrado.current = b.clave;
                        setArrastrandoClave(b.clave);
                      }}
                      alSoltarEncima={() => reordenar(b.clave)}
                      alTerminarArrastre={() => {
                        arrastrado.current = null;
                        setArrastrandoClave(null);
                      }}
                    />
                  ))}
                  {tramo.items.map(
                    (b) =>
                      editando === b.clave && (
                        <EditorBloque
                          key={`ed-${b.clave}`}
                          bloque={b}
                          alCambiar={(c) => cambiar(b.clave, c)}
                          alCerrar={() => setEditando(null)}
                        />
                      )
                  )}
                </ul>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-lila-300 px-5 py-10 text-center text-sm font-light text-violeta-900/45">
          Día vacío. Añade ejercicios abajo, o déjalo así como día de descanso.
        </p>
      )}

      {/* Alta rápida */}
      <div className="mt-6 rounded-4xl bg-lila-50 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-52 flex-1">
            <Search
              size={15}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-violeta-400"
            />
            <Entrada
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio…"
              className="bg-white pl-11"
            />
          </div>
          <Seleccion
            value={grupoFiltro}
            onChange={(e) => setGrupoFiltro(e.target.value)}
            className="w-40 bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(GRUPOS).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </Seleccion>
          <div className="flex items-end gap-2">
            <label className="text-[10px] tracking-widest text-violeta-500 uppercase">
              <span className="mb-1 block">Series</span>
              <Entrada
                type="number"
                min={1}
                max={20}
                value={series}
                onChange={(e) => setSeries(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] tracking-widest text-violeta-500 uppercase">
              <span className="mb-1 block">Reps</span>
              <Entrada
                value={repeticiones}
                onChange={(e) => setRepeticiones(e.target.value)}
                className="w-24 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="text-[10px] tracking-widest text-violeta-500 uppercase">
              <span className="mb-1 block">Descanso</span>
              <Seleccion
                value={descanso}
                onChange={(e) => setDescanso(Number(e.target.value))}
                className="w-28 bg-white px-3 py-2 text-sm"
              >
                {DESCANSOS.map((s) => (
                  <option key={s} value={s}>
                    {formatearDuracion(s)}
                  </option>
                ))}
              </Seleccion>
            </label>
          </div>
        </div>

        {/* Resultados de la búsqueda: toda la biblioteca, no solo los primeros. */}
        <p className="mt-4 text-[10px] tracking-widest text-violeta-500 uppercase">
          {candidatos.length} ejercicio{candidatos.length === 1 ? "" : "s"} de la
          biblioteca
        </p>
        <div className="mt-2 flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-2xl">
          {candidatos.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => anadirEjercicio(e.id)}
              className="flex h-fit cursor-pointer items-center gap-2 rounded-full border border-lila-300 bg-white px-4 py-2 text-xs text-violeta-800 transition-all hover:border-violeta-500 hover:shadow-suave"
            >
              <Plus size={12} className="text-violeta-500" />
              {e.nombre}
              <span className="text-violeta-900/40">{GRUPOS[e.grupo]}</span>
            </button>
          ))}
          {candidatos.length === 0 && (
            <p className="text-xs font-light text-violeta-900/45">
              Ningún ejercicio coincide con la búsqueda.
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-lila-200 pt-4">
          <Boton
            variante="contorno"
            tamano="sm"
            onClick={() => anadir(bloqueDescanso(descanso))}
          >
            <Timer size={13} />
            Añadir descanso
          </Boton>
          <Boton
            variante="contorno"
            tamano="sm"
            onClick={() => anadir(bloqueEtiqueta())}
          >
            <Type size={13} />
            Añadir título
          </Boton>
          <Boton
            variante="contorno"
            tamano="sm"
            disabled={bloques.length < 2}
            onClick={() => agruparUltimos(2)}
          >
            <Layers size={13} />
            Agrupar los 2 últimos en circuito
          </Boton>
        </div>
      </div>
    </section>
  );
}

function EditorBloque({
  bloque,
  alCambiar,
  alCerrar,
}: {
  bloque: Bloque;
  alCambiar: (cambios: Partial<Bloque>) => void;
  alCerrar: () => void;
}) {
  return (
    <li className="ml-6 rounded-3xl border border-violeta-500/30 bg-lila-50 p-5">
      {bloque.tipo === "etiqueta" ? (
        <label className="block text-[10px] tracking-widest text-violeta-500 uppercase">
          <span className="mb-1.5 block">Título de la sección</span>
          <Entrada
            value={bloque.texto ?? ""}
            onChange={(e) => alCambiar({ texto: e.target.value })}
            placeholder="Calentamiento"
            className="bg-white"
          />
        </label>
      ) : bloque.tipo === "descanso" ? (
        <label className="block text-[10px] tracking-widest text-violeta-500 uppercase">
          <span className="mb-1.5 block">Duración del descanso (segundos)</span>
          <Entrada
            type="number"
            min={5}
            step={5}
            value={bloque.descanso_seg}
            onChange={(e) =>
              alCambiar({ descanso_seg: Math.max(5, Number(e.target.value) || 5) })
            }
            className="w-40 bg-white"
          />
        </label>
      ) : (
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="text-[10px] tracking-widest text-violeta-500 uppercase">
            <span className="mb-1.5 block">Series</span>
            <Entrada
              type="number"
              min={1}
              max={20}
              value={bloque.series}
              onChange={(e) =>
                alCambiar({ series: Math.max(1, Number(e.target.value) || 1) })
              }
              className="bg-white"
            />
          </label>
          <label className="text-[10px] tracking-widest text-violeta-500 uppercase">
            <span className="mb-1.5 block">Repeticiones</span>
            <Entrada
              value={bloque.repeticiones}
              onChange={(e) => alCambiar({ repeticiones: e.target.value })}
              className="bg-white"
            />
          </label>
          <label className="text-[10px] tracking-widest text-violeta-500 uppercase">
            <span className="mb-1.5 block">Descanso (s)</span>
            <Entrada
              type="number"
              min={0}
              step={5}
              value={bloque.descanso_seg}
              onChange={(e) =>
                alCambiar({ descanso_seg: Math.max(0, Number(e.target.value) || 0) })
              }
              className="bg-white"
            />
          </label>
          <label className="text-[10px] tracking-widest text-violeta-500 uppercase">
            <span className="mb-1.5 block">Peso sugerido</span>
            <Entrada
              value={bloque.peso_sugerido ?? ""}
              onChange={(e) => alCambiar({ peso_sugerido: e.target.value })}
              placeholder="20 kg"
              className="bg-white"
            />
          </label>
          <label className="text-[10px] tracking-widest text-violeta-500 uppercase sm:col-span-4">
            <span className="mb-1.5 block">Nota para la clienta</span>
            <Entrada
              value={bloque.notas ?? ""}
              onChange={(e) => alCambiar({ notas: e.target.value })}
              placeholder="Tempo lento, última serie al fallo…"
              className="bg-white"
            />
          </label>
        </div>
      )}

      <div className={cn("mt-4")}>
        <Boton variante="suave" tamano="sm" onClick={alCerrar}>
          <Check size={13} />
          Listo
        </Boton>
      </div>
    </li>
  );
}
