import "server-only";
import { crearClienteServidor } from "./supabase/servidor";
import { fechaATexto } from "./programacion";

/**
 * Lo que una clienta tiene asignado cada día, junto: el entrenamiento sale
 * de `sesiones` y la alimentación se calcula.
 *
 * Los entrenamientos se guardan fecha a fecha porque cada uno es distinto y
 * se marca como hecho por separado. La alimentación no: un plan es una
 * semana que se repite durante las que dure, así que guardar una fila por
 * día solo serviría para que se desincronizaran en cuanto Yiyo cambiara una
 * comida o moviera la fecha de inicio. Se deduce del plan en cada consulta,
 * y así el calendario enseña siempre lo que el plan dice hoy.
 */

/** Semanas que dura un plan cuando no lo dice —planes de antes de 0021—. */
export const SEMANAS_POR_DEFECTO = 4;

export type ComidaDelDia = {
  id: string;
  nombre: string;
  hora: string | null;
  alimentos: string[];
};

export type DiaDeAlimentacion = {
  fecha: string;
  clienteId: string;
  planId: string;
  planNombre: string;
  /** Primer día del plan: el calendario lo destaca. */
  empieza: boolean;
  comidas: ComidaDelDia[];
};

/**
 * Último día que cubre un plan.
 *
 * Tres semanas desde el 1 de octubre terminan el 21, no el 22: el día de
 * inicio cuenta como el primero de la primera semana.
 */
export function finDePlan(inicio: string, semanas?: number | null): string {
  const f = new Date(inicio + "T00:00:00");
  f.setDate(f.getDate() + (semanas || SEMANAS_POR_DEFECTO) * 7 - 1);
  return fechaATexto(f);
}

/** Forma cruda que devuelve PostgREST para la consulta de más abajo. */
type PlanParaAgenda = {
  id: string;
  nombre: string;
  cliente_id: string;
  inicio: string;
  /** Ausente hasta que se ejecute 0021. */
  semanas?: number;
  plan_dias: {
    numero: number;
    plan_comidas: {
      id: string;
      nombre: string;
      orden: number;
      hora: string | null;
      comida_alimentos: {
        orden: number;
        alimentos: { nombre: string } | null;
      }[];
    }[];
  }[];
};

/** Día de la semana como lo numera `plan_dias`: 1 = lunes … 7 = domingo. */
function diaDeLaSemana(fecha: Date) {
  return ((fecha.getDay() + 6) % 7) + 1;
}

/**
 * Los días de alimentación de una o varias clientas dentro de una ventana.
 *
 * `clientes` vacío significa «todas las que se puedan ver»: de eso ya se
 * encarga RLS, que a una entrenadora solo le deja ver las suyas.
 */
export async function alimentacionPorDia(
  desde: string,
  hasta: string,
  clientes?: string[]
): Promise<DiaDeAlimentacion[]> {
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("planes_alimentacion")
    .select(
      // `*` y no la lista de columnas: mientras 0021 no se haya ejecutado,
      // `semanas` no existe y nombrarla haría fallar la consulta entera
      // —el calendario se quedaría en blanco—. Con `*` simplemente no
      // viene, y `finDePlan` cae en su valor por defecto.
      `*,
       plan_dias ( numero,
         plan_comidas ( id, nombre, orden, hora,
           comida_alimentos ( orden, alimentos ( nombre ) ) ) )`
    )
    .eq("activo", true);

  if (clientes?.length) consulta = consulta.in("cliente_id", clientes);

  // `returns` porque los tipos generados no saben deducir la forma de una
  // consulta anidada: es el mismo apaño que usa `planActivoDe`.
  const { data: planes } = await consulta.returns<PlanParaAgenda[]>();
  if (!planes?.length) return [];

  const dias: DiaDeAlimentacion[] = [];

  for (const plan of planes) {
    // La ventana del plan recortada a la que pide el calendario: sin esto,
    // un plan de hace un año generaría trescientos días que nadie va a ver.
    const finPlan = finDePlan(plan.inicio, plan.semanas);
    const desdePlan = plan.inicio > desde ? plan.inicio : desde;
    const hastaPlan = finPlan < hasta ? finPlan : hasta;
    if (desdePlan > hastaPlan) continue;

    const porNumero = new Map(
      (plan.plan_dias ?? []).map((d) => [
        d.numero,
        [...(d.plan_comidas ?? [])]
          .sort((a, b) => a.orden - b.orden)
          .map((c) => ({
            id: c.id,
            nombre: c.nombre,
            hora: c.hora,
            alimentos: [...(c.comida_alimentos ?? [])]
              .sort((a, b) => a.orden - b.orden)
              .map((i) => i.alimentos?.nombre)
              .filter((n): n is string => !!n),
          })),
      ])
    );

    const cursor = new Date(desdePlan + "T00:00:00");
    const fin = new Date(hastaPlan + "T00:00:00");

    while (cursor <= fin) {
      const comidas = porNumero.get(diaDeLaSemana(cursor));
      // Un plan de cuatro días a la semana deja libres los otros tres: esos
      // no aparecen en el calendario, igual que no aparece un día sin
      // entrenamiento.
      if (comidas?.length) {
        const fecha = fechaATexto(cursor);
        dias.push({
          fecha,
          clienteId: plan.cliente_id,
          planId: plan.id,
          planNombre: plan.nombre,
          empieza: fecha === plan.inicio,
          comidas,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return dias;
}
