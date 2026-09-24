"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/autenticacion";
import { asegurarEntrenadora } from "@/lib/datos";
import { programaCompleto } from "@/lib/catalogo";
import {
  calcularSesiones,
  fechaATexto,
  hoyTexto,
  lunesDesde,
} from "@/lib/programacion";
import { SEMANAS_POR_CICLO } from "@/lib/progresion";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Asigna un programa del catálogo a una clienta.
 *
 * Copia la plantilla entera —días y bloques— para que quede a nombre de esa
 * clienta, la deja como su rutina activa y le llena el calendario. La
 * plantilla original no se toca: si mañana Yiyo le cambia una serie a esta
 * chica, las demás siguen igual.
 */
export async function asignarPrograma(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const programaId = texto(datos, "programa_id");
  const clienteId = texto(datos, "cliente_id");
  if (!programaId) return { error: "Elige un programa." };
  if (!clienteId) return { error: "Elige a quién se lo asignas." };

  const inicio = texto(datos, "fecha_inicio") || hoyTexto();
  const semanas =
    Math.min(Math.max(Number(texto(datos, "semanas")) || SEMANAS_POR_CICLO, 1), 24);

  const completo = await programaCompleto(programaId);
  if (!completo) return { error: "Ese programa ya no está disponible." };
  const { programa, dias } = completo;

  // Solo una rutina activa a la vez: la anterior se archiva, no se borra,
  // para no perder el historial de entrenamientos ya registrados.
  await supabase
    .from("rutinas")
    .update({ activa: false })
    .eq("cliente_id", clienteId)
    .eq("activa", true);

  const { data: copia, error: errorCopia } = await supabase
    .from("rutinas")
    .insert({
      nombre: programa.nombre,
      descripcion: programa.descripcion,
      entrenador_id: perfil.id,
      cliente_id: clienteId,
      es_plantilla: false,
      es_sistema: false,
      origen_id: programa.id,
      categoria: programa.categoria,
      nivel: programa.nivel,
      emoji: programa.emoji,
      duracion_desde: programa.duracion_desde,
      duracion_hasta: programa.duracion_hasta,
      resumen: programa.resumen,
      frecuencia: programa.frecuencia,
      semanas,
      dias_por_semana: dias.length,
      fecha_inicio: inicio,
      activa: true,
    })
    .select()
    .single();

  if (errorCopia || !copia) {
    return { error: errorCopia?.message ?? "No se pudo asignar el programa." };
  }

  const { data: diasCreados, error: errorDias } = await supabase
    .from("rutina_dias")
    .insert(
      dias.map((d) => ({
        rutina_id: copia.id,
        numero: d.numero,
        nombre: d.nombre,
        notas: d.notas,
      }))
    )
    .select("id, numero, nombre");

  if (errorDias || !diasCreados) {
    return { error: errorDias?.message ?? "No se pudieron copiar los días." };
  }

  // Los bloques se reinsertan apuntando al día nuevo, no al de la plantilla.
  const idPorNumero = new Map(diasCreados.map((d) => [d.numero, d.id]));
  const bloques = dias.flatMap((d) =>
    d.bloques.map((b) => ({
      dia_id: idPorNumero.get(d.numero)!,
      tipo: b.tipo,
      ejercicio_id: b.ejercicio_id,
      texto: b.texto,
      orden: b.orden,
      series: b.series,
      repeticiones: b.repeticiones,
      descanso_seg: b.descanso_seg,
      peso_sugerido: b.peso_sugerido,
      notas: b.notas,
      grupo: b.grupo,
      grupo_repeticiones: b.grupo_repeticiones,
    }))
  );

  if (bloques.length) {
    const { error } = await supabase.from("rutina_ejercicios").insert(bloques);
    if (error) return { error: error.message };
  }

  await asegurarEntrenadora(clienteId, perfil.id);

  // Se limpia lo que quedara programado y sin hacer, para que el calendario
  // no mezcle la rutina vieja con la nueva. Solo lo de entrenamiento: si
  // esta clienta tiene además un plan de alimentación activo, su marca en
  // el calendario no tiene nada que ver con esta rutina y no debe borrarse.
  //
  // El borrado arranca en el mismo lunes desde el que `calcularSesiones`
  // genera las nuevas: si se usa `inicio` a secas y no cae en lunes, las
  // sesiones nuevas de hasta seis días antes quedan solapadas con las de la
  // rutina anterior y el calendario muestra ambas.
  const desde = fechaATexto(lunesDesde(new Date(inicio + "T00:00:00")));
  await supabase
    .from("sesiones")
    .delete()
    .eq("cliente_id", clienteId)
    .eq("tipo_sesion", "entrenamiento")
    .eq("estado", "programada")
    .gte("fecha", desde);

  const planificadas = calcularSesiones(
    inicio,
    semanas,
    diasCreados.sort((a, b) => a.numero - b.numero)
  );

  if (planificadas.length) {
    const { error } = await supabase.from("sesiones").insert(
      planificadas.map((s) => ({
        cliente_id: clienteId,
        entrenador_id: perfil.id,
        rutina_dia_id: s.dia.id,
        titulo: `${programa.nombre} · ${s.dia.nombre}`,
        fecha: s.fecha,
        hora: "07:00",
        duracion_min: programa.duracion_hasta ?? 60,
      }))
    );
    if (error) return { error: error.message };
  }

  const { data: cliente } = await supabase
    .from("clientes")
    .select("perfil_id")
    .eq("id", clienteId)
    .single();

  if (cliente) {
    await supabase.from("notificaciones").insert({
      perfil_id: cliente.perfil_id,
      tipo: "rutina",
      titulo: "Tienes un programa nuevo",
      cuerpo: `Yiyo te asignó «${programa.nombre}». Ya está en tu calendario.`,
      enlace: "/panel/entrenamientos",
    });
  }

  revalidatePath("/entrenador/rutinas");
  revalidatePath("/entrenador/calendario");
  revalidatePath("/panel/calendario");
  revalidatePath(`/entrenador/clientes/${clienteId}`);
  redirect(`/entrenador/rutinas/${copia.id}`);
}
