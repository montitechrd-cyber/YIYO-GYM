"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cambiarEstadoPedido } from "./acciones";
import { cn } from "@/lib/utils";
import type { EstadoPedido } from "@/lib/supabase/tipos";

const ETAPAS: { valor: EstadoPedido; texto: string; tono: string }[] = [
  { valor: "nuevo", texto: "Nuevo", tono: "bg-violeta-100 text-violeta-700" },
  { valor: "confirmado", texto: "Confirmado", tono: "bg-sky-50 text-sky-700" },
  { valor: "enviado", texto: "Enviado", tono: "bg-amber-50 text-amber-700" },
  { valor: "entregado", texto: "Entregado", tono: "bg-emerald-50 text-emerald-700" },
  { valor: "cancelado", texto: "Cancelado", tono: "bg-rose-50 text-rose-700" },
];

export function SelectorEstado({
  pedidoId,
  estado,
}: {
  pedidoId: string;
  estado: EstadoPedido;
}) {
  const [actual, setActual] = useState(estado);
  const [fallo, setFallo] = useState(false);
  const [guardando, iniciar] = useTransition();
  const tono = ETAPAS.find((e) => e.valor === actual)?.tono ?? "";

  return (
    <span className="relative inline-flex items-center">
      <select
        value={actual}
        disabled={guardando}
        aria-label="Estado del pedido"
        onChange={(e) => {
          const nuevo = e.target.value as EstadoPedido;
          const previo = actual;
          setActual(nuevo);
          setFallo(false);
          iniciar(async () => {
            const r = await cambiarEstadoPedido(pedidoId, nuevo);
            // Si falla, la etiqueta vuelve atrás y se avisa: sin esto
            // parecería guardado y no lo estaría.
            if (r?.error) {
              setActual(previo);
              setFallo(true);
            }
          });
        }}
        className={cn(
          "cursor-pointer appearance-none rounded-full px-4 py-2 pr-8 text-xs font-medium transition-colors",
          fallo ? "bg-rose-100 text-rose-700" : tono,
          guardando && "opacity-60"
        )}
      >
        {ETAPAS.map((e) => (
          <option key={e.valor} value={e.valor}>
            {e.texto}
          </option>
        ))}
      </select>
      {guardando && (
        <Loader2 size={13} className="pointer-events-none absolute right-2.5 animate-spin" />
      )}
      {fallo && (
        <span role="alert" className="ml-2 text-xs text-rose-600">
          No se guardó
        </span>
      )}
    </span>
  );
}
