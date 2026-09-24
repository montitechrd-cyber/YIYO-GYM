import type { Ejercicio, RutinaEjercicio, TipoBloque } from "./supabase/tipos";

/** Un bloque tal como se edita en el navegador, antes de guardarse. */
export type Bloque = {
  /** Identificador local mientras se edita; el de la base al cargar. */
  clave: string;
  tipo: TipoBloque;
  ejercicio_id: string | null;
  texto: string | null;
  series: number;
  repeticiones: string;
  descanso_seg: number;
  peso_sugerido: string | null;
  notas: string | null;
  grupo: number | null;
  grupo_repeticiones: number;
};

/**
 * Segundos que se estiman por serie de trabajo. Es una media razonable para
 * una serie de fuerza: sirve para dar una idea de cuánto dura la sesión.
 */
const SEGUNDOS_POR_SERIE = 45;

export function desdeFila(fila: RutinaEjercicio): Bloque {
  return {
    clave: fila.id,
    // Los valores por defecto cubren las filas guardadas antes de que
    // existieran los bloques: todas eran ejercicios sueltos.
    tipo: fila.tipo ?? "ejercicio",
    ejercicio_id: fila.ejercicio_id,
    texto: fila.texto ?? null,
    series: fila.series,
    repeticiones: fila.repeticiones,
    descanso_seg: fila.descanso_seg,
    peso_sugerido: fila.peso_sugerido,
    notas: fila.notas,
    grupo: fila.grupo ?? null,
    grupo_repeticiones: fila.grupo_repeticiones ?? 1,
  };
}

export function bloqueEjercicio(ejercicioId: string): Bloque {
  return {
    clave: crypto.randomUUID(),
    tipo: "ejercicio",
    ejercicio_id: ejercicioId,
    texto: null,
    series: 3,
    repeticiones: "10",
    descanso_seg: 60,
    peso_sugerido: null,
    notas: null,
    grupo: null,
    grupo_repeticiones: 1,
  };
}

export function bloqueDescanso(segundos = 60): Bloque {
  return {
    ...bloqueEjercicio(""),
    clave: crypto.randomUUID(),
    tipo: "descanso",
    ejercicio_id: null,
    descanso_seg: segundos,
  };
}

export function bloqueEtiqueta(texto = "Calentamiento"): Bloque {
  return {
    ...bloqueEjercicio(""),
    clave: crypto.randomUUID(),
    tipo: "etiqueta",
    ejercicio_id: null,
    texto,
  };
}

/** Duración de un bloque suelto, sin contar repeticiones de circuito. */
function segundosDeBloque(b: Bloque) {
  if (b.tipo === "etiqueta") return 0;
  if (b.tipo === "descanso") return b.descanso_seg;
  return b.series * SEGUNDOS_POR_SERIE + Math.max(b.series - 1, 0) * b.descanso_seg;
}

/**
 * Duración estimada de la sesión completa. Los bloques que forman un circuito
 * cuentan tantas veces como se repita el circuito.
 */
export function duracionEstimada(bloques: Bloque[]) {
  let total = 0;
  let i = 0;

  while (i < bloques.length) {
    const grupo = bloques[i].grupo;

    if (grupo == null) {
      total += segundosDeBloque(bloques[i]);
      i++;
      continue;
    }

    let suma = 0;
    const repeticiones = bloques[i].grupo_repeticiones || 1;
    while (i < bloques.length && bloques[i].grupo === grupo) {
      suma += segundosDeBloque(bloques[i]);
      i++;
    }
    total += suma * repeticiones;
  }

  return total;
}

export function formatearDuracion(segundos: number) {
  if (segundos <= 0) return "—";
  const min = Math.floor(segundos / 60);
  const seg = Math.round(segundos % 60);
  if (min === 0) return `${seg}s`;
  if (seg === 0) return `${min} min`;
  return `${min} min ${seg}s`;
}

/** Texto corto que resume la prescripción, para listados compactos. */
export function resumenBloque(b: Bloque, ejercicio?: Ejercicio | null) {
  if (b.tipo === "etiqueta") return b.texto ?? "";
  if (b.tipo === "descanso") return formatearDuracion(b.descanso_seg);
  return [
    `${b.series} × ${b.repeticiones}`,
    b.peso_sugerido,
    ejercicio?.equipo,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Renumera los circuitos para que queden consecutivos tras editar la lista. */
export function normalizarGrupos(bloques: Bloque[]): Bloque[] {
  const equivalencias = new Map<number, number>();
  let siguiente = 1;

  return bloques.map((b) => {
    if (b.grupo == null) return b;
    if (!equivalencias.has(b.grupo)) equivalencias.set(b.grupo, siguiente++);
    return { ...b, grupo: equivalencias.get(b.grupo)! };
  });
}
