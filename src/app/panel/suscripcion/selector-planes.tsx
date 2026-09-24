"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { confirmarSuscripcion } from "./acciones";
import { Aviso } from "@/components/ui/aviso";
import { Tarjeta, TituloTarjeta } from "@/components/panel/piezas";
import { MONEDA } from "@/lib/etiquetas";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/supabase/tipos";

type BotonesPaypal = {
  Buttons: (opciones: {
    style?: Record<string, string>;
    createSubscription: (
      datos: unknown,
      acciones: { subscription: { create: (c: { plan_id: string }) => Promise<string> } }
    ) => Promise<string>;
    onApprove: (datos: { subscriptionID?: string | null }) => Promise<void>;
    onError: (error: unknown) => void;
  }) => { render: (selector: HTMLElement) => Promise<void> };
};

declare global {
  interface Window {
    paypal?: BotonesPaypal;
  }
}

export function SelectorPlanes({
  planes,
  clientId,
}: {
  planes: Plan[];
  clientId: string | null;
}) {
  const [elegido, setElegido] = useState<Plan | null>(null);
  const [estado, setEstado] = useState<{ error?: string; exito?: string }>({});
  const [procesando, setProcesando] = useState(false);
  const [sdkListo, setSdkListo] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sdkListo || !elegido?.paypal_plan_id || !contenedor.current) return;
    if (!window.paypal) return;

    contenedor.current.innerHTML = "";

    window.paypal
      .Buttons({
        style: { shape: "pill", color: "gold", layout: "vertical", label: "subscribe" },
        createSubscription: (_datos, acciones) =>
          acciones.subscription.create({ plan_id: elegido.paypal_plan_id! }),
        onApprove: async (datos) => {
          if (!datos.subscriptionID) return;
          setProcesando(true);
          const resultado = await confirmarSuscripcion(
            elegido.id,
            datos.subscriptionID
          );
          setEstado(resultado);
          setProcesando(false);
        },
        onError: () =>
          setEstado({ error: "PayPal no pudo completar la operación. Intenta de nuevo." }),
      })
      .render(contenedor.current);
  }, [sdkListo, elegido]);

  return (
    <Tarjeta>
      <TituloTarjeta>Elige tu plan</TituloTarjeta>

      {estado.error && (
        <Aviso tono="error" className="mb-5">
          {estado.error}
        </Aviso>
      )}
      {estado.exito && (
        <Aviso tono="exito" className="mb-5">
          {estado.exito}
        </Aviso>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {planes.map((p) => (
          <button
            key={p.id}
            onClick={() => setElegido(p)}
            className={cn(
              "cursor-pointer rounded-4xl border p-7 text-left transition-all duration-500",
              elegido?.id === p.id
                ? "fondo-degradado border-transparent text-white shadow-elevada"
                : "border-lila-200 bg-white hover:-translate-y-1 hover:border-lila-400 hover:shadow-suave"
            )}
          >
            <p
              className={cn(
                "text-[10px] tracking-[0.22em] uppercase",
                elegido?.id === p.id ? "text-lila-100" : "text-violeta-500"
              )}
            >
              {p.nombre}
            </p>
            {p.descripcion && (
              <p
                className={cn(
                  "mt-3 text-sm font-light",
                  elegido?.id === p.id ? "text-lila-50" : "text-violeta-900/60"
                )}
              >
                {p.descripcion}
              </p>
            )}

            {/* El precio no se muestra aquí a propósito: solo aparece al
                elegir el plan, justo antes de pagar. */}
            <ul className="mt-6 space-y-2.5">
              {p.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-xs font-light">
                  <Check
                    size={13}
                    strokeWidth={2.5}
                    className={cn(
                      "mt-0.5 shrink-0",
                      elegido?.id === p.id ? "text-lila-100" : "text-violeta-500"
                    )}
                  />
                  <span
                    className={
                      elegido?.id === p.id ? "text-lila-50" : "text-violeta-900/70"
                    }
                  >
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {elegido && (
        <div className="mt-8 border-t border-lila-100 pt-7">
          <div className="mb-6 flex items-baseline justify-between gap-4 rounded-3xl bg-lila-50 px-6 py-5">
            <span className="text-sm font-light text-violeta-900/70">
              Plan {elegido.nombre}
            </span>
            <span className="text-3xl font-light text-violeta-800">
              {MONEDA.format(Number(elegido.precio_mensual))}
              <span className="ml-1 text-sm text-violeta-900/50">/mes</span>
            </span>
          </div>

          {procesando ? (
            <p className="flex items-center gap-3 text-sm font-light text-violeta-700">
              <Loader2 size={16} className="animate-spin" />
              Confirmando tu suscripción…
            </p>
          ) : !clientId ? (
            <Aviso tono="info">
              Para cobrar necesitas configurar PayPal. Añade{" "}
              <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> y{" "}
              <code>PAYPAL_CLIENT_SECRET</code> en <code>.env.local</code>.
            </Aviso>
          ) : !elegido.paypal_plan_id ? (
            <Aviso tono="info">
              El plan «{elegido.nombre}» todavía no tiene un plan de PayPal asociado.
              La administradora debe añadir su <code>paypal_plan_id</code> desde el
              panel de administración.
            </Aviso>
          ) : (
            <>
              <p className="mb-5 text-sm font-light text-violeta-900/60">
                Completa el pago para activar el plan{" "}
                <strong className="font-medium text-violeta-700">
                  {elegido.nombre}
                </strong>
                .
              </p>
              <Script
                src={`https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`}
                data-sdk-integration-source="button-factory"
                onReady={() => setSdkListo(true)}
              />
              <div ref={contenedor} className="max-w-sm" />
            </>
          )}
        </div>
      )}
    </Tarjeta>
  );
}
