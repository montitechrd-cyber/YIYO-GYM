import type { Alimento, ObjetivoFitness } from "./supabase/tipos";

export type Macros = {
  calorias: number;
  proteina: number;
  carbohidratos: number;
  grasa: number;
  fibra: number;
};

export const MACROS_CERO: Macros = {
  calorias: 0,
  proteina: 0,
  carbohidratos: 0,
  grasa: 0,
  fibra: 0,
};

/**
 * Macros de una cantidad concreta de un alimento.
 *
 * Los valores del catálogo están por 100 g / 100 ml, salvo los que se cuentan
 * por unidad (un huevo, una rebanada), donde ya son por pieza.
 */
export function macrosDe(alimento: Alimento, cantidad: number): Macros {
  const factor = alimento.unidad === "unidad" ? cantidad : cantidad / 100;
  return {
    calorias: Number(alimento.calorias) * factor,
    proteina: Number(alimento.proteina_g) * factor,
    carbohidratos: Number(alimento.carbohidratos_g) * factor,
    grasa: Number(alimento.grasa_g) * factor,
    fibra: Number(alimento.fibra_g) * factor,
  };
}

export function sumarMacros(lista: Macros[]): Macros {
  return lista.reduce(
    (t, m) => ({
      calorias: t.calorias + m.calorias,
      proteina: t.proteina + m.proteina,
      carbohidratos: t.carbohidratos + m.carbohidratos,
      grasa: t.grasa + m.grasa,
      fibra: t.fibra + m.fibra,
    }),
    { ...MACROS_CERO }
  );
}

export function redondear(m: Macros): Macros {
  return {
    calorias: Math.round(m.calorias),
    proteina: Math.round(m.proteina),
    carbohidratos: Math.round(m.carbohidratos),
    grasa: Math.round(m.grasa),
    fibra: Math.round(m.fibra),
  };
}

/** Cómo se escribe la cantidad según cómo se mida el alimento. */
export function textoCantidad(alimento: Alimento, cantidad: number) {
  if (alimento.unidad === "unidad") {
    const n = Number(cantidad.toFixed(2));
    return `${n} ${n === 1 ? "unidad" : "unidades"}`;
  }
  return `${Math.round(cantidad)} ${alimento.unidad}`;
}

// ---------------------------------------------------------------------
// Objetivo calórico
// ---------------------------------------------------------------------

/** Factor de actividad según cuántos días entrena a la semana. */
function factorActividad(diasEntreno: number) {
  if (diasEntreno <= 1) return 1.2;
  if (diasEntreno <= 3) return 1.375;
  if (diasEntreno <= 5) return 1.55;
  return 1.725;
}

/** Ajuste sobre el gasto según lo que se busque. */
const AJUSTE_OBJETIVO: Record<ObjetivoFitness, number> = {
  perder_grasa: -0.2,
  ganar_musculo: 0.1,
  recomposicion: 0,
  fuerza: 0.05,
  salud: 0,
  tonificar: -0.1,
};

/** Proteína recomendada en gramos por kilo de peso. */
const PROTEINA_POR_KILO: Record<ObjetivoFitness, number> = {
  perder_grasa: 2.2,
  ganar_musculo: 2.0,
  recomposicion: 2.0,
  fuerza: 1.8,
  salud: 1.6,
  tonificar: 2.0,
};

export type DatosCalculo = {
  pesoKg: number;
  alturaCm: number;
  edad: number;
  genero?: string | null;
  diasEntreno?: number | null;
  objetivo?: ObjetivoFitness | null;
};

export type Sugerencia = Macros & {
  gastoBasal: number;
  gastoTotal: number;
};

/**
 * Propuesta de calorías y macros diarios.
 *
 * Usa la fórmula de Mifflin-St Jeor para el gasto basal, la ajusta por
 * actividad y por el objetivo, y reparte los macros: la proteína según el peso
 * corporal, la grasa al 25 % de las calorías y el resto en carbohidratos.
 *
 * Es una referencia orientativa para que la entrenadora tenga un punto de
 * partida, no una prescripción: siempre puede ajustarla a mano.
 */
export function sugerirObjetivo(datos: DatosCalculo): Sugerencia | null {
  const { pesoKg, alturaCm, edad } = datos;
  if (!pesoKg || !alturaCm || !edad) return null;

  const esHombre = (datos.genero ?? "").toLowerCase().startsWith("m");
  const gastoBasal =
    10 * pesoKg + 6.25 * alturaCm - 5 * edad + (esHombre ? 5 : -161);

  const gastoTotal = gastoBasal * factorActividad(datos.diasEntreno ?? 3);
  const objetivo = datos.objetivo ?? "salud";
  const calorias = gastoTotal * (1 + AJUSTE_OBJETIVO[objetivo]);

  const proteina = pesoKg * PROTEINA_POR_KILO[objetivo];
  const grasa = (calorias * 0.25) / 9;
  const carbohidratos = Math.max(
    (calorias - proteina * 4 - grasa * 9) / 4,
    0
  );

  return {
    gastoBasal: Math.round(gastoBasal),
    gastoTotal: Math.round(gastoTotal),
    calorias: Math.round(calorias),
    proteina: Math.round(proteina),
    carbohidratos: Math.round(carbohidratos),
    grasa: Math.round(grasa),
    fibra: Math.round((calorias / 1000) * 14),
  };
}

/** Edad a partir de la fecha de nacimiento. */
export function edadDesde(fechaNacimiento?: string | null): number | null {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento + "T00:00:00");
  if (Number.isNaN(nacimiento.getTime())) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad > 0 && edad < 120 ? edad : null;
}

/** Porcentaje de cumplimiento respecto al objetivo, acotado para la barra. */
export function porcentaje(actual: number, objetivo?: number | null) {
  if (!objetivo || objetivo <= 0) return 0;
  return Math.min(Math.round((actual / objetivo) * 100), 150);
}

export const CATEGORIAS_ALIMENTO = {
  proteina: "Proteínas",
  carbohidrato: "Carbohidratos",
  grasa: "Grasas",
  verdura: "Verduras",
  fruta: "Frutas",
  lacteo: "Lácteos",
  legumbre: "Legumbres",
  bebida: "Bebidas",
  otro: "Otros",
} as const;

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export const COMIDAS_POR_DEFECTO = [
  { nombre: "Desayuno", hora: "07:30" },
  { nombre: "Media mañana", hora: "10:30" },
  { nombre: "Almuerzo", hora: "13:00" },
  { nombre: "Merienda", hora: "16:30" },
  { nombre: "Cena", hora: "19:30" },
];
