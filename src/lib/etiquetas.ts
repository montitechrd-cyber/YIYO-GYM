import type {
  EstadoCliente,
  EstadoSesion,
  EstadoSuscripcion,
  GrupoMuscular,
  NivelExperiencia,
  ObjetivoFitness,
  RolUsuario,
} from "./supabase/tipos";

export const ROLES: Record<RolUsuario, string> = {
  admin: "Administradora",
  entrenador: "Entrenadora",
  cliente: "Clienta",
};

export const ESTADOS_CLIENTE: Record<EstadoCliente, string> = {
  prospecto: "Prospecto",
  activo: "Activa",
  pausado: "En pausa",
  inactivo: "Inactiva",
};

export const TONO_ESTADO_CLIENTE = {
  prospecto: "lila",
  activo: "verde",
  pausado: "ambar",
  inactivo: "gris",
} as const;

export const OBJETIVOS: Record<ObjetivoFitness, string> = {
  perder_grasa: "Perder grasa",
  ganar_musculo: "Ganar músculo",
  recomposicion: "Recomposición corporal",
  fuerza: "Ganar fuerza",
  salud: "Salud general",
  tonificar: "Tonificar",
};

export const NIVELES: Record<NivelExperiencia, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const GRUPOS: Record<GrupoMuscular, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  gluteos: "Glúteos",
  cuadriceps: "Cuádriceps",
  femorales: "Femorales",
  gemelos: "Gemelos",
  core: "Core",
  cardio: "Cardio",
  cuerpo_completo: "Cuerpo completo",
};

export const ESTADOS_SESION: Record<EstadoSesion, string> = {
  programada: "Programada",
  completada: "Completada",
  omitida: "Omitida",
  cancelada: "Cancelada",
};

export const TONO_ESTADO_SESION = {
  programada: "lila",
  completada: "verde",
  omitida: "ambar",
  cancelada: "gris",
} as const;

export const ESTADOS_SUSCRIPCION: Record<EstadoSuscripcion, string> = {
  activa: "Activa",
  pendiente: "Pendiente",
  cancelada: "Cancelada",
  vencida: "Vencida",
  prueba: "En prueba",
};

export const TONO_SUSCRIPCION = {
  activa: "verde",
  pendiente: "ambar",
  cancelada: "gris",
  vencida: "rosa",
  prueba: "lila",
} as const;

/** Medidas corporales que se registran en evaluación y progreso. */
export const MEDIDAS = [
  { clave: "cuello", etiqueta: "Cuello" },
  { clave: "pecho", etiqueta: "Pecho" },
  { clave: "cintura", etiqueta: "Cintura" },
  { clave: "abdomen", etiqueta: "Abdomen" },
  { clave: "cadera", etiqueta: "Cadera" },
  { clave: "gluteos", etiqueta: "Glúteos" },
  { clave: "muslo", etiqueta: "Muslo" },
  { clave: "pantorrilla", etiqueta: "Pantorrilla" },
  { clave: "brazo", etiqueta: "Brazo" },
] as const;

export const FECHA_LARGA = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const FECHA_CORTA = new Intl.DateTimeFormat("es-DO", {
  day: "numeric",
  month: "short",
});

export const MONEDA = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "USD",
});

/** Convierte una fecha `YYYY-MM-DD` de Postgres a Date local sin desfase. */
export function fechaLocal(iso: string) {
  return new Date(iso + "T00:00:00");
}
