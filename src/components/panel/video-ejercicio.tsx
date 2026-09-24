"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Aviso de «he empezado a reproducir»: lo escuchan todas las tarjetas para
 * cerrarse si la que arrancó no es ella. Pausar el `<video>` no bastaba —la
 * tarjeta anterior se quedaba abierta, con sus controles y su «X», dando a
 * entender que seguía activa.
 */
const EVENTO_REPRODUCCION = "yiyo:video-reproduciendo";

/**
 * Convierte un enlace de YouTube o Vimeo en su URL para incrustar.
 * Devuelve null si no es ninguno de los dos (entonces se trata como
 * archivo de video directo, por ejemplo uno subido a Supabase Storage).
 */
export function urlIncrustable(enlace: string): string | null {
  const id = idDeYoutube(enlace);
  if (id) return `https://www.youtube.com/embed/${id}`;

  try {
    const u = new URL(enlace);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "vimeo.com") {
      const vid = u.pathname.split("/").filter(Boolean)[0];
      return /^\d+$/.test(vid ?? "") ? `https://player.vimeo.com/video/${vid}` : null;
    }
    if (host === "player.vimeo.com") return enlace;
    return null;
  } catch {
    return null;
  }
}

function idDeYoutube(enlace: string): string | null {
  try {
    const u = new URL(enlace);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return v;
      const corto = u.pathname.match(/^\/(shorts|embed|v)\/([\w-]+)/);
      return corto ? corto[2] : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Video demostrativo de un ejercicio, dentro de su tarjeta.
 *
 * El marco es cuadrado y no cambia nunca: ni al reproducir, ni entre un
 * video y otro. Los videos llegan en tres formatos distintos (verticales
 * de móvil 9:16, cuadrados 1:1 y horizontales 16:9); si el marco siguiera
 * la proporción de cada uno, la tarjeta daría un salto de tamaño al pulsar
 * play y la cuadrícula quedaría desigual. El cuadrado es el término medio
 * de los tres, así que es el que menos desperdicia.
 *
 * En portada el fotograma se recorta para llenar el cuadro —la cuadrícula
 * queda pareja—; al reproducir se muestra entero, sin recortar, centrado
 * sobre el fondo violeta. Va siempre en silencio: son demostraciones de
 * técnica, y una cuadrícula que empieza a sonar sola resulta molesta.
 * Una «X» arriba a la derecha cierra la reproducción y vuelve a la portada.
 */
export function VistaPreviaVideo({
  url,
  titulo,
  className,
  onCambioReproduccion,
}: {
  url: string;
  titulo: string;
  className?: string;
  /** Avisa cuando empieza o termina la reproducción —la usa la tarjeta para
   *  apartar de en medio la casilla «Hecho», que vive en la misma esquina. */
  onCambioReproduccion?: (activo: boolean) => void;
}) {
  const incrustado = urlIncrustable(url);
  const idYt = idDeYoutube(url);
  const [reproduciendo, setReproduciendo] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const propio = useId();

  const marcarReproduciendo = () => {
    setReproduciendo(true);
    onCambioReproduccion?.(true);
    window.dispatchEvent(
      new CustomEvent(EVENTO_REPRODUCCION, { detail: propio })
    );
  };

  const arrancar = () => {
    // `play()` va dentro del propio clic: si se aplaza, el navegador deja de
    // considerarlo un gesto de la persona y bloquea la reproducción.
    video.current?.play().catch(() => {});
    marcarReproduciendo();
  };

  const cerrar = () => {
    video.current?.pause();
    setReproduciendo(false);
    onCambioReproduccion?.(false);
  };

  // Solo un video abierto a la vez en toda la pantalla.
  useEffect(() => {
    const alReproducirOtro = (e: Event) => {
      if ((e as CustomEvent<string>).detail === propio) return;
      video.current?.pause();
      setReproduciendo(false);
      onCambioReproduccion?.(false);
    };
    window.addEventListener(EVENTO_REPRODUCCION, alReproducirOtro);
    return () =>
      window.removeEventListener(EVENTO_REPRODUCCION, alReproducirOtro);
  }, [propio, onCambioReproduccion]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full aspect-square overflow-hidden bg-violeta-900",
        className
      )}
    >
      {incrustado ? (
        reproduciendo ? (
          <iframe
            src={`${incrustado}?autoplay=1&rel=0&mute=1&muted=1`}
            title={`Video de ${titulo}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`https://img.youtube.com/vi/${idYt}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      ) : (
        <video
          ref={video}
          // `#t=0.1` hace que el navegador pinte un fotograma como portada.
          // Se deja fijo: cambiar el src en marcha recargaría el video.
          src={`${url}#t=0.1`}
          controls={reproduciendo}
          loop
          // Silencio: son demostraciones de técnica, el audio no aporta y
          // molesta. `muted` además permite que el navegador reproduzca sin
          // pelearse con su bloqueo de autoreproducción con sonido.
          muted
          playsInline
          preload="metadata"
          onPlay={marcarReproduciendo}
          className={cn(
            "absolute inset-0 h-full w-full",
            // Portada recortada para que la cuadrícula quede pareja; al
            // reproducir se ve entero, que es cuando importa la técnica.
            reproduciendo ? "object-contain" : "object-cover"
          )}
        >
          Tu navegador no puede reproducir este video.{" "}
          <a href={url} target="_blank" rel="noreferrer">
            Ábrelo aquí
          </a>
          .
        </video>
      )}

      {!reproduciendo && (
        <button
          type="button"
          onClick={arrancar}
          aria-label={`Reproducir el video de ${titulo}`}
          className="group absolute inset-0 flex cursor-pointer items-center justify-center bg-violeta-900/30 transition-colors hover:bg-violeta-900/10"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-violeta-700 shadow-elevada transition-transform duration-300 group-hover:scale-110">
            <Play size={22} className="ml-0.5" fill="currentColor" />
          </span>
        </button>
      )}

      {reproduciendo && (
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar el video"
          className="absolute top-3 right-3 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-violeta-900/70 text-white shadow-suave backdrop-blur transition-colors hover:bg-violeta-900/90"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
