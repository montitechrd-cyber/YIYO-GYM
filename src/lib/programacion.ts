/**
 * Reparte los días de una rutina a lo largo de la semana y calcula las fechas
 * de cada sesión, para que al asignar una rutina aparezca en el calendario.
 */

/** Día de la semana de cada entrenamiento: 0 = domingo … 6 = sábado. */
const PATRON_SEMANAL: Record<number, number[]> = {
  1: [1], //             lunes
  2: [1, 4], //          lunes, jueves
  3: [1, 3, 5], //       lunes, miércoles, viernes
  4: [1, 2, 4, 5], //    lunes, martes, jueves, viernes
  5: [1, 2, 3, 4, 5], // de lunes a viernes
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
};

/**
 * Fecha en formato `AAAA-MM-DD` usando el calendario local.
 *
 * No sirve `toISOString()`: convierte a UTC y, en un servidor al este de
 * Greenwich, la medianoche local cae en el día anterior. Las sesiones se
 * guardaban con un día de menos.
 */
export function fechaATexto(fecha: Date) {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
}

/** Hoy, en formato `AAAA-MM-DD` local. */
export function hoyTexto() {
  return fechaATexto(new Date());
}

/** Lunes de la semana de `fecha`, o la misma fecha si ya es lunes. */
export function lunesDesde(fecha: Date) {
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);
  const desplazamiento = (f.getDay() + 6) % 7; // lunes = 0
  f.setDate(f.getDate() - desplazamiento);
  return f;
}

export type DiaProgramable = { id: string; numero: number; nombre: string };

/**
 * Fechas para cada día de la rutina, repetidas durante `semanas`.
 * Empieza en el lunes de la semana de `fechaInicio`.
 */
export function calcularSesiones(
  fechaInicio: string,
  semanas: number,
  dias: DiaProgramable[]
): { dia: DiaProgramable; fecha: string }[] {
  if (dias.length === 0) return [];

  // Con más de siete días no hay patrón semanal posible: se acota para no
  // caer en el de tres días, donde `indice % 3` repetía el mismo día de la
  // semana y varias sesiones distintas terminaban en la misma fecha.
  const patron =
    PATRON_SEMANAL[Math.min(Math.max(dias.length, 1), 7)] ?? PATRON_SEMANAL[7];
  const base = lunesDesde(new Date(fechaInicio + "T00:00:00"));
  const sesiones: { dia: DiaProgramable; fecha: string }[] = [];

  for (let semana = 0; semana < semanas; semana++) {
    dias.forEach((dia, indice) => {
      const diaSemana = patron[indice % patron.length];
      // El patrón usa domingo = 0, pero la semana arranca en lunes.
      const desplazamiento = (diaSemana === 0 ? 7 : diaSemana) - 1;
      const fecha = new Date(base);
      fecha.setDate(base.getDate() + semana * 7 + desplazamiento);
      sesiones.push({ dia, fecha: fechaATexto(fecha) });
    });
  }

  return sesiones;
}

/**
 * Ventana de fechas que se carga en el calendario, en formato `AAAA-MM-DD`.
 *
 * El calendario deja navegar mes a mes, pero traer el histórico completo de
 * todas las clientas crece sin tope. Medio año atrás y un año por delante
 * cubre el uso real —incluidos los programas más largos— con un número de
 * filas acotado.
 */
export function ventanaCalendario(mesesAtras = 6, mesesAdelante = 12) {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - mesesAtras);
  const hasta = new Date();
  hasta.setMonth(hasta.getMonth() + mesesAdelante);
  return { desde: fechaATexto(desde), hasta: fechaATexto(hasta) };
}
