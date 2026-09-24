"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { enviarMensaje, marcarLeidos } from "@/app/panel/chat/acciones";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { cn } from "@/lib/utils";
import type { Mensaje } from "@/lib/supabase/tipos";

const HORA = new Intl.DateTimeFormat("es-DO", {
  hour: "2-digit",
  minute: "2-digit",
});

const DIA = new Intl.DateTimeFormat("es-DO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function Chat({
  conversacionId,
  perfilId,
  nombreOtro,
  inicialesOtro,
  mensajesIniciales,
}: {
  conversacionId: string;
  perfilId: string;
  nombreOtro: string;
  inicialesOtro: string;
  mensajesIniciales: Mensaje[];
}) {
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [texto, setTexto] = useState("");
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    marcarLeidos(conversacionId);
  }, [conversacionId]);

  useEffect(() => {
    const supabase = crearClienteNavegador();
    let canal: RealtimeChannel | null = null;
    let cancelado = false;

    (async () => {
      // Igual que en el centro de notificaciones: sin el token del usuario,
      // las políticas RLS descartan los eventos sin avisar.
      const { data } = await supabase.auth.getSession();
      if (cancelado) return;
      await supabase.realtime.setAuth(data.session?.access_token);
      if (cancelado) return;

      canal = supabase
        .channel(`chat-${conversacionId}-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "mensajes",
            filter: `conversacion_id=eq.${conversacionId}`,
          },
          (evento) => {
            const nuevo = evento.new as Mensaje;
            setMensajes((previos) =>
              previos.some((m) => m.id === nuevo.id) ? previos : [...previos, nuevo]
            );
          }
        )
        .subscribe((estado, error) => {
          if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
            console.warn("[YIYO] Chat en vivo no disponible:", estado, error);
          }
        });
    })();

    return () => {
      cancelado = true;
      if (canal) supabase.removeChannel(canal);
    };
  }, [conversacionId]);

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setTexto("");
    setErrorEnvio(null);
    iniciarEnvio(async () => {
      // Si el envío falla hay que devolverle el texto: antes se descartaba el
      // resultado y el mensaje desaparecía de la pantalla sin aviso ni forma
      // de recuperarlo.
      const r = await enviarMensaje(conversacionId, limpio);
      if (r?.error) {
        setTexto((actual) => (actual.trim() ? actual : limpio));
        setErrorEnvio("No se pudo enviar. Revisa tu conexión e inténtalo otra vez.");
      }
    });
  };

  // Los separadores de fecha se calculan antes de pintar: mutar una variable
  // dentro del map altera el render y React lo penaliza.
  const conSeparadores = useMemo(
    () =>
      mensajes.reduce<{ mensaje: Mensaje; dia: string; nuevoDia: boolean }[]>(
        (acumulado, mensaje) => {
          const dia = DIA.format(new Date(mensaje.creado_en));
          acumulado.push({
            mensaje,
            dia,
            nuevoDia: dia !== acumulado.at(-1)?.dia,
          });
          return acumulado;
        },
        []
      ),
    [mensajes]
  );

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-4xl border border-lila-200 bg-white shadow-suave">
      <header className="flex items-center gap-3 border-b border-lila-200 px-6 py-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full fondo-degradado text-xs font-medium text-white">
          {inicialesOtro}
        </span>
        <div>
          <p className="font-medium text-violeta-800">{nombreOtro}</p>
          <p className="text-[11px] font-light text-violeta-900/45">
            Los mensajes llegan al instante
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-lila-50/60 px-6 py-6">
        {mensajes.length === 0 && (
          <p className="mt-16 text-center text-sm font-light text-violeta-900/45">
            Todavía no hay mensajes. Escribe el primero.
          </p>
        )}

        {conSeparadores.map(({ mensaje: m, dia, nuevoDia }) => {
          const mio = m.autor_id === perfilId;
          const fecha = new Date(m.creado_en);

          return (
            <div key={m.id}>
              {nuevoDia && (
                <p className="my-5 text-center text-[10px] tracking-[0.16em] text-violeta-900/35 uppercase">
                  {dia}
                </p>
              )}
              <div className={cn("flex", mio ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-3xl px-5 py-3",
                    mio
                      ? "fondo-degradado rounded-br-lg text-white"
                      : "rounded-bl-lg border border-lila-200 bg-white text-violeta-900"
                  )}
                >
                  <p className="text-sm leading-relaxed font-light whitespace-pre-wrap">
                    {m.contenido}
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-[10px]",
                      mio ? "text-lila-100/70" : "text-violeta-900/35"
                    )}
                  >
                    {HORA.format(fecha)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <footer className="border-t border-lila-200 px-5 py-4">
        {errorEnvio && (
          <p
            role="alert"
            className="mb-3 rounded-2xl bg-rose-50 px-4 py-2.5 text-xs font-light text-rose-700"
          >
            {errorEnvio}
          </p>
        )}
        <div className="flex items-end gap-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            rows={1}
            aria-label="Escribe tu mensaje"
            placeholder="Escribe tu mensaje…"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-lila-300 bg-lila-50/60 px-5 py-3 text-sm text-violeta-900 outline-none transition-all placeholder:text-violeta-900/35 focus:border-violeta-500 focus:bg-white focus:ring-4 focus:ring-lila-200/60"
          />
          <button
            onClick={enviar}
            disabled={enviando || !texto.trim()}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full fondo-degradado text-white shadow-suave transition-all hover:brightness-110 disabled:opacity-40"
            aria-label="Enviar mensaje"
          >
            {enviando ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
