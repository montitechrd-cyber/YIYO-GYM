"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirPerfil, exigirRol } from "@/lib/autenticacion";
import { hoyTexto } from "@/lib/programacion";
import type {
  EstadoCliente,
  NivelExperiencia,
  ObjetivoFitness,
} from "@/lib/supabase/tipos";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

function numero(datos: FormData, campo: string) {
  const v = texto(datos, campo);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function actualizarCliente(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const id = texto(datos, "id");
  if (!id) return { error: "Falta el identificador del cliente." };

  const supabase = await crearClienteServidor();
  const etiquetas = texto(datos, "etiquetas")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("clientes")
    .update({
      estado: (texto(datos, "estado") || "prospecto") as EstadoCliente,
      origen: texto(datos, "origen") || null,
      objetivo: (texto(datos, "objetivo") || null) as ObjetivoFitness | null,
      nivel: (texto(datos, "nivel") || null) as NivelExperiencia | null,
      notas: texto(datos, "notas") || null,
      etiquetas,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/entrenador/clientes/${id}`);
  revalidatePath("/entrenador/clientes");
  return { exito: "Ficha actualizada." };
}

export async function asignarmeCliente(clienteId: string) {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  await supabase
    .from("clientes")
    .update({ entrenador_id: perfil.id })
    .eq("id", clienteId);

  revalidatePath(`/entrenador/clientes/${clienteId}`);
  revalidatePath("/entrenador/clientes");
}

export async function agregarNota(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const clienteId = texto(datos, "cliente_id");
  const contenido = texto(datos, "contenido");

  if (!contenido) return { error: "Escribe algo antes de guardar." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("notas_cliente")
    .insert({ cliente_id: clienteId, autor_id: perfil.id, contenido });

  if (error) return { error: error.message };

  revalidatePath(`/entrenador/clientes/${clienteId}`);
  return { exito: "Nota guardada." };
}

export async function borrarNota(notaId: string, clienteId: string) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  await supabase.from("notas_cliente").delete().eq("id", notaId);
  revalidatePath(`/entrenador/clientes/${clienteId}`);
}

export async function guardarEvaluacion(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  // La llena la clienta al registrarse y la completa la entrenadora, así que
  // vale cualquier sesión iniciada —pero alguna hace falta: sin esto la
  // acción quedaba abierta y solo la frenaba la seguridad de la base.
  await exigirPerfil();

  const supabase = await crearClienteServidor();
  const clienteId = texto(datos, "cliente_id");
  if (!clienteId) return { error: "Falta el cliente." };

  const medidas: Record<string, number> = {};
  for (const [clave, valor] of datos.entries()) {
    if (!clave.startsWith("medida_") || typeof valor !== "string") continue;
    const n = Number(valor.trim());
    if (valor.trim() && Number.isFinite(n)) medidas[clave.slice(7)] = n;
  }

  const fecha = texto(datos, "fecha") || hoyTexto();
  const pesoKg = numero(datos, "peso_kg");
  const grasaPct = numero(datos, "grasa_pct");
  const registro = {
    cliente_id: clienteId,
    fecha,
    altura_cm: numero(datos, "altura_cm"),
    peso_kg: pesoKg,
    grasa_pct: grasaPct,
    dias_disponibles: numero(datos, "dias_disponibles"),
    objetivos: texto(datos, "objetivos") || null,
    condiciones_medicas: texto(datos, "condiciones_medicas") || null,
    lesiones: texto(datos, "lesiones") || null,
    medicamentos: texto(datos, "medicamentos") || null,
    alergias_alimentarias: texto(datos, "alergias_alimentarias") || null,
    equipo_disponible: texto(datos, "equipo_disponible") || null,
    habitos_sueno: texto(datos, "habitos_sueno") || null,
    nivel_estres: texto(datos, "nivel_estres") || null,
    medidas,
  };

  // Si ya existe una evaluación (la clienta la envió al registrarse), la
  // entrenadora la completa en el mismo registro en vez de duplicarla —
  // típicamente añadiendo las medidas, que solo toma ella.
  // El `.eq("cliente_id")` ata la evaluación a su ficha: sin él, un
  // `evaluacion_id` de una clienta con un `cliente_id` de otra reescribía la
  // primera con los datos de la segunda.
  const evaluacionId = texto(datos, "evaluacion_id");
  const { error } = evaluacionId
    ? await supabase
        .from("evaluaciones")
        .update(registro)
        .eq("id", evaluacionId)
        .eq("cliente_id", clienteId)
    : await supabase.from("evaluaciones").insert(registro);

  if (error) return { error: error.message };

  // La evaluación inicial alimenta el progreso: si ya hay peso o medidas,
  // queda como el primer punto de la línea de tiempo, sin que haya que
  // volver a escribir lo mismo a mano en «Registrar progreso».
  if (pesoKg != null || grasaPct != null || Object.keys(medidas).length > 0) {
    await supabase.from("progreso").upsert(
      {
        cliente_id: clienteId,
        fecha,
        peso_kg: pesoKg,
        grasa_pct: grasaPct,
        medidas,
      },
      { onConflict: "cliente_id,fecha" }
    );
  }

  // La evaluación completa convierte al prospecto en clienta activa.
  const objetivo = texto(datos, "objetivo");
  const nivel = texto(datos, "nivel");
  await supabase
    .from("clientes")
    .update({
      estado: "activo",
      ...(objetivo ? { objetivo: objetivo as ObjetivoFitness } : {}),
      ...(nivel ? { nivel: nivel as NivelExperiencia } : {}),
    })
    .eq("id", clienteId);

  revalidatePath("/panel");
  revalidatePath("/panel/progreso");
  revalidatePath(`/entrenador/clientes/${clienteId}`);
  revalidatePath(`/entrenador/clientes/${clienteId}/progreso`);
  return { exito: "Evaluación guardada." };
}
