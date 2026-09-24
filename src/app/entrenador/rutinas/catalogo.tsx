"use client";

import { useState } from "react";
import { CalendarDays, Clock, Dumbbell, Loader2, Sparkles } from "lucide-react";
import { asignarPrograma } from "./acciones-asignar";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { Dialogo } from "@/components/ui/dialogo";
import { Insignia } from "@/components/panel/piezas";
import { useAccionFormulario } from "@/lib/formularios";
import { SEMANAS_POR_CICLO } from "@/lib/progresion";
import type { ProgramaDelCatalogo } from "@/lib/catalogo";

export type ClienteSimple = { id: string; nombre: string };

export function Catalogo({
  programas,
  clientes,
  hoy,
  clientePreseleccionado,
}: {
  programas: ProgramaDelCatalogo[];
  clientes: ClienteSimple[];
  hoy: string;
  clientePreseleccionado?: string;
}) {
  const [elegido, setElegido] = useState<ProgramaDelCatalogo | null>(null);

  const niveles = programas.filter((p) => p.categoria === "nivel");
  const objetivos = programas.filter((p) => p.categoria === "objetivo");

  return (
    <>
      <Seccion
        titulo="Por nivel"
        descripcion="Elige según la experiencia que tenga. Es el punto de partida para casi todas"
        programas={niveles}
        alElegir={setElegido}
      />

      <Seccion
        titulo="Por objetivo"
        descripcion="Cuando ya sabes qué busca: glúteos, bajar grasa, tonificar o esculpir"
        programas={objetivos}
        alElegir={setElegido}
      />

      <DialogoAsignar
        programa={elegido}
        clientes={clientes}
        hoy={hoy}
        clientePreseleccionado={clientePreseleccionado}
        alCerrar={() => setElegido(null)}
      />
    </>
  );
}

function Seccion({
  titulo,
  descripcion,
  programas,
  alElegir,
}: {
  titulo: string;
  descripcion: string;
  programas: ProgramaDelCatalogo[];
  alElegir: (p: ProgramaDelCatalogo) => void;
}) {
  if (programas.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-[11px] tracking-[0.2em] text-violeta-500 uppercase">
        {titulo}
      </h2>
      <p className="mt-1.5 mb-6 text-sm font-light text-violeta-900/55">
        {descripcion}
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {programas.map((p) => (
          <TarjetaPrograma key={p.id} programa={p} alElegir={alElegir} />
        ))}
      </div>
    </section>
  );
}

function TarjetaPrograma({
  programa: p,
  alElegir,
}: {
  programa: ProgramaDelCatalogo;
  alElegir: (p: ProgramaDelCatalogo) => void;
}) {
  return (
    <article className="flex flex-col rounded-4xl border border-lila-200 bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:border-lila-400 hover:shadow-elevada">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-3xl">{p.emoji}</span>
          <h3 className="mt-3 text-xl font-medium text-violeta-800">{p.nombre}</h3>
          <p className="mt-1 text-xs font-light text-violeta-900/55">{p.resumen}</p>
        </div>
        {p.nivel && <Insignia tono="lila">{p.nivel}</Insignia>}
      </div>

      <dl className="mt-6 space-y-2 text-xs font-light text-violeta-900/60">
        <div className="flex items-center gap-2">
          <CalendarDays size={13} className="shrink-0 text-lila-400" />
          {p.frecuencia}
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="shrink-0 text-lila-400" />
          {p.duracion_desde}–{p.duracion_hasta} min por sesión
        </div>
        <div className="flex items-center gap-2">
          <Dumbbell size={13} className="shrink-0 text-lila-400" />
          {p.totalEjercicios} ejercicios repartidos en {p.dias.length} días
        </div>
      </dl>

      <ul className="mt-5 space-y-1.5 border-t border-lila-100 pt-5">
        {p.dias.map((d) => (
          <li key={d.numero} className="text-xs font-light text-violeta-900/70">
            <span className="text-violeta-900/35">Día {d.numero}</span> · {d.nombre}
          </li>
        ))}
      </ul>

      {/* Igual que en el catálogo de dietas: el botón va anclado al fondo
          para que todos queden a la misma altura en la fila. */}
      <div className="mt-auto pt-7">
        <Boton className="w-full" onClick={() => alElegir(p)}>
          <Sparkles size={15} />
          Asignar
        </Boton>
      </div>
    </article>
  );
}

function DialogoAsignar({
  programa,
  clientes,
  hoy,
  clientePreseleccionado,
  alCerrar,
}: {
  programa: ProgramaDelCatalogo | null;
  clientes: ClienteSimple[];
  hoy: string;
  clientePreseleccionado?: string;
  alCerrar: () => void;
}) {
  const { estado, enviar, pendiente } = useAccionFormulario(asignarPrograma);

  return (
    <Dialogo
      abierto={programa !== null}
      alCerrar={alCerrar}
      ancho="max-w-lg"
      titulo={programa ? `${programa.emoji} ${programa.nombre}` : ""}
      descripcion={
        programa
          ? `${programa.frecuencia} · ${programa.dias.length} días · ${programa.totalEjercicios} ejercicios`
          : undefined
      }
    >
      {programa && (
        <form action={enviar} className="space-y-5">
          <input type="hidden" name="programa_id" value={programa.id} />

          {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

          {clientes.length === 0 ? (
            <Aviso tono="info">
              Todavía no tienes clientas registradas. Añade una primero y luego
              le asignas su programa.
            </Aviso>
          ) : (
            <>
              <Campo etiqueta="Para quién" htmlFor="cliente_id">
                <Seleccion
                  id="cliente_id"
                  name="cliente_id"
                  required
                  defaultValue={clientePreseleccionado ?? ""}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Empieza el" htmlFor="fecha_inicio">
                  <Entrada
                    id="fecha_inicio"
                    name="fecha_inicio"
                    type="date"
                    defaultValue={hoy}
                  />
                </Campo>
                <Campo etiqueta="Semanas" htmlFor="semanas">
                  <Entrada
                    id="semanas"
                    name="semanas"
                    type="number"
                    min="1"
                    max="24"
                    defaultValue={SEMANAS_POR_CICLO}
                  />
                </Campo>
              </div>

              <p className="rounded-2xl border border-lila-200 bg-lila-50/60 px-5 py-3 text-xs leading-relaxed font-light text-violeta-900/65">
                Se le crea su propia copia del programa y se le llenan las
                sesiones en el calendario. Después puedes ajustarle series,
                repeticiones o ejercicios sin que afecte a nadie más.
              </p>

              <Boton type="submit" tamano="lg" className="w-full" disabled={pendiente}>
                {pendiente && <Loader2 size={16} className="animate-spin" />}
                {pendiente ? "Asignando…" : "Asignar programa"}
              </Boton>
            </>
          )}
        </form>
      )}
    </Dialogo>
  );
}
