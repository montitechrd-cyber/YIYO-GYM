"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Calendar,
  CreditCard,
  Dumbbell,
  Info,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import {
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "@/app/notificaciones/acciones";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { cn } from "@/lib/utils";
import type { Notificacion, TipoNotificacion } from "@/lib/supabase/tipos";

const ICONOS: Record<TipoNotificacion, React.ElementType> = {
  mensaje: MessageCircle,
  rutina: Dumbbell,
  sesion: Calendar,
  pago: CreditCard,
  progreso: TrendingUp,
  sistema: Info,
};

const RELATIVO = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

function haceCuanto(iso: string) {
  const segundos = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (segundos < 60) return "ahora";
  if (segundos < 3600) return RELATIVO.format(-Math.floor(segundos / 60), "minute");
  if (segundos < 86400) return RELATIVO.format(-Math.floor(segundos / 3600), "hour");
  return RELATIVO.format(-Math.floor(segundos / 86400), "day");
}

export function CentroNotificaciones({
  perfilId,
  iniciales,
  alinear = "derecha",
}: {
  perfilId: string;
  iniciales: Notificacion[];
  /**
   * Hacia dónde se abre el panel. Desde la campana de la barra lateral
   * —pegada al borde izquierdo de la pantalla— abrirlo hacia la izquierda
   * (el valor por defecto) lo saca de la ventana y corta el texto; ahí hay
   * que abrirlo hacia la derecha, donde sí hay sitio.
   */
  alinear?: "izquierda" | "derecha";
}) {
  const [notificaciones, setNotificaciones] = useState(iniciales);
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  useEffect(() => {
    const supabase = crearClienteNavegador();
    let canal: RealtimeChannel | null = null;
    let cancelado = false;

    (async () => {
      // Realtime necesita el token del usuario: sin él las políticas RLS
      // descartan los eventos en silencio, sin marcar error en el canal.
      const { data } = await supabase.auth.getSession();
      if (cancelado) return;
      await supabase.realtime.setAuth(data.session?.access_token);
      if (cancelado) return;

      // El sufijo único evita que `channel()` devuelva un canal ya suscrito
      // cuando React vuelve a montar el efecto en desarrollo.
      canal = supabase
        .channel(`notificaciones-${perfilId}-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificaciones",
            filter: `perfil_id=eq.${perfilId}`,
          },
          (evento) => {
            const nueva = evento.new as Notificacion;
            setNotificaciones((previas) =>
              previas.some((n) => n.id === nueva.id)
                ? previas
                : [nueva, ...previas].slice(0, 30)
            );
          }
        )
        .subscribe((estado, error) => {
          if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
            console.warn(
              "[YIYO] Notificaciones en vivo no disponibles:",
              estado,
              error
            );
          }
        });
    })();

    return () => {
      cancelado = true;
      if (canal) supabase.removeChannel(canal);
    };
  }, [perfilId]);

  useEffect(() => {
    if (!abierto) return;
    const alClicar = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", alClicar);
    return () => document.removeEventListener("mousedown", alClicar);
  }, [abierto]);

  return (
    <div className="relative" ref={contenedor}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative cursor-pointer rounded-full p-2.5 text-violeta-700 transition-colors hover:bg-lila-100"
        aria-label={`Notificaciones${sinLeer ? ` (${sinLeer} sin leer)` : ""}`}
      >
        <Bell size={19} strokeWidth={1.6} />
        {sinLeer > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violeta-500 px-1 text-[9px] font-medium text-white">
            {sinLeer > 9 ? "9+" : sinLeer}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className={cn(
            "animate-aparecer absolute z-50 mt-2 w-88 max-w-[calc(100vw-2rem)] overflow-hidden rounded-4xl border border-lila-200 bg-white shadow-elevada",
            alinear === "izquierda" ? "left-0" : "right-0"
          )}
        >
          <header className="flex items-center justify-between border-b border-lila-200 px-5 py-4">
            <h3 className="text-[11px] tracking-[0.2em] text-violeta-500 uppercase">
              Notificaciones
            </h3>
            {sinLeer > 0 && (
              <button
                onClick={() => {
                  setNotificaciones((ns) => ns.map((n) => ({ ...n, leida: true })));
                  marcarTodasLeidas();
                }}
                className="cursor-pointer text-[11px] font-light text-violeta-600 underline-offset-4 hover:underline"
              >
                Marcar todas
              </button>
            )}
          </header>

          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length > 0 ? (
              <ul>
                {notificaciones.map((n) => {
                  const Icono = ICONOS[n.tipo];
                  const contenido = (
                    <>
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                          n.leida
                            ? "bg-lila-50 text-violeta-500/60"
                            : "bg-lila-200 text-violeta-700"
                        )}
                      >
                        <Icono size={16} strokeWidth={1.6} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-sm",
                            n.leida
                              ? "font-light text-violeta-900/60"
                              : "font-medium text-violeta-800"
                          )}
                        >
                          {n.titulo}
                        </span>
                        {n.cuerpo && (
                          <span className="mt-0.5 block truncate text-xs font-light text-violeta-900/50">
                            {n.cuerpo}
                          </span>
                        )}
                        <span className="mt-1 block text-[10px] font-light text-violeta-900/35">
                          {haceCuanto(n.creado_en)}
                        </span>
                      </span>
                    </>
                  );

                  const clases = cn(
                    "flex w-full items-start gap-3 border-b border-lila-100 px-5 py-4 text-left transition-colors last:border-0",
                    n.leida ? "hover:bg-lila-50" : "bg-lila-50/60 hover:bg-lila-100"
                  );

                  const alAbrir = () => {
                    if (!n.leida) {
                      setNotificaciones((ns) =>
                        ns.map((x) => (x.id === n.id ? { ...x, leida: true } : x))
                      );
                      marcarNotificacionLeida(n.id);
                    }
                    setAbierto(false);
                  };

                  return (
                    <li key={n.id}>
                      {n.enlace ? (
                        <Link href={n.enlace} onClick={alAbrir} className={clases}>
                          {contenido}
                        </Link>
                      ) : (
                        <button onClick={alAbrir} className={cn(clases, "cursor-pointer")}>
                          {contenido}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-12 text-center text-sm font-light text-violeta-900/45">
                No tienes notificaciones.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
