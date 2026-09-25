"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EVENTO_REPRODUCCION,
  avisarQueArranco,
  carteleraDe,
} from "./mando-reproduccion";

/**
 * Demostración animada de un ejercicio, dentro de su tarjeta.
 *
 * Un WebP animado dentro de un `<img>` arranca solo en cuanto carga, y el
 * navegador no da forma de pararlo. Una cuadrícula con cuarenta muñecos
 * moviéndose a la vez es imposible de leer —y en el móvil son cuarenta
 * descargas—, así que de entrada se enseña la cartelera: el primer cuadro,
 * quieto, con su botón de play. Al pulsar se cambia el archivo por el
 * animado, que es cuando empieza a moverse y cuando se descarga.
 *
 * El marco es cuadrado y sobre blanco, igual que el del video, para que la
 * cuadrícula no dé saltos entre una tarjeta y otra. `contain` y no `cover`:
 * recortar una demostración le corta la cabeza o los pies justo al
 * ejercicio.
 */
export function Demostracion({
  url,
  titulo,
  className,
  onCambioReproduccion,
}: {
  url: string;
  titulo: string;
  className?: string;
  /** Avisa cuando empieza o termina —la tarjeta la usa para apartar la
   *  casilla «Hecho», que vive en la misma esquina que la «X»—. */
  onCambioReproduccion?: (activo: boolean) => void;
}) {
  const cartelera = carteleraDe(url);
  const [animando, setAnimando] = useState(false);
  const propio = useId();

  const arrancar = () => {
    setAnimando(true);
    onCambioReproduccion?.(true);
    avisarQueArranco(propio);
  };

  const parar = () => {
    setAnimando(false);
    onCambioReproduccion?.(false);
  };

  // El aviso a la tarjeta se guarda aparte para que la suscripción no se
  // rehaga en cada render si quien nos usa pasa una función nueva cada vez.
  const avisarTarjeta = useRef(onCambioReproduccion);
  useEffect(() => {
    avisarTarjeta.current = onCambioReproduccion;
  }, [onCambioReproduccion]);

  // Solo una cosa moviéndose a la vez en toda la pantalla, compartido con
  // los videos: pulsar un video calla la demostración de al lado y al revés.
  useEffect(() => {
    const alArrancarOtro = (e: Event) => {
      if ((e as CustomEvent<string>).detail === propio) return;
      setAnimando(false);
      avisarTarjeta.current?.(false);
    };
    window.addEventListener(EVENTO_REPRODUCCION, alArrancarOtro);
    return () => window.removeEventListener(EVENTO_REPRODUCCION, alArrancarOtro);
  }, [propio]);

  // Sin cartelera no hay nada que esperar: se enseña la imagen tal cual.
  if (!cartelera) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={url}
        alt={titulo}
        loading="lazy"
        className={cn("aspect-square w-full bg-white object-contain", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative mx-auto aspect-square w-full overflow-hidden bg-white",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        // Al volver a la cartelera el navegador descarta la animación, así
        // que la siguiente vez empieza desde el principio y no por donde se
        // quedó.
        src={animando ? url : cartelera}
        alt={titulo}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-contain"
      />

      {animando ? (
        <button
          type="button"
          onClick={parar}
          aria-label={`Detener la demostración de ${titulo}`}
          className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-violeta-900/70 text-white backdrop-blur transition-colors hover:bg-violeta-900"
        >
          <X size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={arrancar}
          aria-label={`Ver la demostración de ${titulo}`}
          className="group absolute inset-0 flex cursor-pointer items-center justify-center bg-violeta-900/10 transition-colors hover:bg-violeta-900/20"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-violeta-700 shadow-elevada transition-transform duration-300 group-hover:scale-110">
            <Play size={22} className="ml-0.5" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
