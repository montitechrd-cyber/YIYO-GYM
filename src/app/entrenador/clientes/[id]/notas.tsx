"use client";

import { useActionState, useRef } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { agregarNota, borrarNota, type Resultado } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";

const inicial: Resultado = {};

type NotaVisible = {
  id: string;
  contenido: string;
  creado_en: string;
  autor: string;
};

export function PanelNotas({
  clienteId,
  notas,
}: {
  clienteId: string;
  notas: NotaVisible[];
}) {
  const [estado, accion, pendiente] = useActionState(agregarNota, inicial);
  const formulario = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-6">
      <form
        ref={formulario}
        action={async (datos) => {
          await accion(datos);
          formulario.current?.reset();
        }}
        className="space-y-4"
      >
        <input type="hidden" name="cliente_id" value={clienteId} />
        {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

        <AreaTexto
          name="contenido"
          placeholder="Anota algo sobre esta clienta: su semana, cómo se sintió, qué ajustar…"
          className="min-h-24"
          required
        />
        <Boton type="submit" tamano="sm" disabled={pendiente}>
          {pendiente && <Loader2 size={14} className="animate-spin" />}
          {pendiente ? "Guardando…" : "Añadir nota"}
        </Boton>
      </form>

      {notas.length > 0 ? (
        <ul className="space-y-3 border-t border-lila-100 pt-5">
          {notas.map((n) => (
            <li
              key={n.id}
              className="group rounded-3xl bg-lila-50 px-5 py-4 transition-colors hover:bg-lila-100"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-relaxed font-light whitespace-pre-wrap text-violeta-900/80">
                  {n.contenido}
                </p>
                <form action={borrarNota.bind(null, n.id, clienteId)}>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-full p-1.5 text-violeta-900/25 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600"
                    aria-label="Borrar nota"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
              <p className="mt-2 text-[11px] font-light text-violeta-900/40">
                {n.autor} ·{" "}
                {new Date(n.creado_en).toLocaleDateString("es-DO", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-lila-100 pt-5 text-sm font-light text-violeta-900/45">
          Todavía no hay notas para esta clienta.
        </p>
      )}
    </div>
  );
}
