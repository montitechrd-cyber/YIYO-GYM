/**
 * Progresión: en qué semana del ciclo va cada clienta y qué toca hacer.
 *
 * El ciclo dura seis semanas y se repite. No hace falta guardar nada por
 * semana: todo sale de la fecha en que empezó la rutina.
 */

import { fechaATexto, hoyTexto } from "./programacion";

export type Fase = {
  semana: number;
  titulo: string;
  /** Qué hacer esta semana, en una frase. */
  indicacion: string;
  /** Detalle para la entrenadora. */
  detalle: string;
  emoji: string;
};

export const CICLO: Fase[] = [
  {
    semana: 1,
    titulo: "Adaptación",
    indicacion: "Aprender el movimiento con peso cómodo",
    detalle:
      "Se trata de coger el gesto, no de exigir. Cargas conservadoras y atención a la técnica en cada serie.",
    emoji: "🌱",
  },
  {
    semana: 2,
    titulo: "Más repeticiones",
    indicacion: "Mismo peso, una o dos repeticiones más por serie",
    detalle:
      "Se sube el volumen antes que la carga. Si la técnica se rompe, se vuelve a las repeticiones de la semana 1.",
    emoji: "📈",
  },
  {
    semana: 3,
    titulo: "Más peso",
    indicacion: "Subir la carga y volver a las repeticiones de la semana 1",
    detalle:
      "Primer salto de carga del ciclo. Un incremento pequeño basta: lo importante es que se pueda repetir la semana siguiente.",
    emoji: "🏋️",
  },
  {
    semana: 4,
    titulo: "Más volumen",
    indicacion: "Semana más exigente: más series o menos descanso",
    detalle:
      "Pico del ciclo. Se puede añadir una serie a los ejercicios principales o recortar el descanso entre series.",
    emoji: "🔥",
  },
  {
    semana: 5,
    titulo: "Descarga",
    indicacion: "Bajar la intensidad para recuperar",
    detalle:
      "Semana de recuperación: se reduce la carga y el volumen. Es lo que permite que el siguiente ciclo empiece más fuerte.",
    emoji: "🌙",
  },
  {
    semana: 6,
    titulo: "Nuevo ciclo",
    indicacion: "Volver a empezar con más carga que la primera vez",
    detalle:
      "Se reinicia el ciclo tomando como punto de partida las cargas de la semana 3 o 4, no las del inicio.",
    emoji: "🔄",
  },
];

/** La regla que decide si toca subir peso. */
export const REGLA_DE_CARGA =
  "Si completa todas las repeticiones con buena técnica y todavía podría hacer varias más, sube ligeramente la carga en la siguiente sesión.";

export const SEMANAS_POR_CICLO = CICLO.length;

export type EstadoProgresion = {
  /** Semanas transcurridas desde que empezó, contando desde 1. */
  semanaTotal: number;
  /** Semana dentro del ciclo actual, de 1 a 6. */
  semana: number;
  /** Número de ciclo, contando desde 1. */
  ciclo: number;
  fase: Fase;
};

/**
 * En qué semana va una rutina que empezó el día `fechaInicio`.
 *
 * Devuelve null si todavía no ha empezado o si la rutina no tiene fecha,
 * que es lo que pasa con las rutinas antiguas creadas a mano.
 */
export function progresionDe(
  fechaInicio: string | null | undefined,
  hoy: string = hoyTexto()
): EstadoProgresion | null {
  if (!fechaInicio) return null;

  const inicio = new Date(fechaInicio + "T00:00:00");
  const actual = new Date(hoy + "T00:00:00");
  const dias = Math.floor((actual.getTime() - inicio.getTime()) / 86_400_000);
  if (dias < 0) return null;

  const semanaTotal = Math.floor(dias / 7) + 1;
  const indice = (semanaTotal - 1) % SEMANAS_POR_CICLO;

  return {
    semanaTotal,
    semana: indice + 1,
    ciclo: Math.floor((semanaTotal - 1) / SEMANAS_POR_CICLO) + 1,
    fase: CICLO[indice],
  };
}

/** Lunes en que arranca una semana concreta del programa. */
export function inicioDeSemana(fechaInicio: string, semanaTotal: number) {
  const f = new Date(fechaInicio + "T00:00:00");
  f.setDate(f.getDate() + (semanaTotal - 1) * 7);
  return fechaATexto(f);
}
