"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/autenticacion";
import type { GrupoMuscular, NivelExperiencia } from "@/lib/supabase/tipos";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

/** Tamaño máximo por archivo subido a la biblioteca (50 MB). */
const LIMITE_BYTES = 50 * 1024 * 1024;

/** Sube un archivo al bucket de ejercicios y devuelve su URL pública. */
async function subirMedia(archivo: File | null, perfilId: string) {
  if (!archivo || archivo.size === 0) return null;

  if (archivo.size > LIMITE_BYTES) {
    throw new Error(
      `«${archivo.name}» pesa ${(archivo.size / 1024 / 1024).toFixed(0)} MB. El máximo son 50 MB; súbelo a YouTube y pega el enlace.`
    );
  }

  const supabase = await crearClienteServidor();
  const extension = archivo.name.split(".").pop() ?? "bin";
  const ruta = `${perfilId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("ejercicios")
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });

  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);

  const { data } = supabase.storage.from("ejercicios").getPublicUrl(ruta);
  return data.publicUrl;
}

export async function guardarEjercicio(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const nombre = texto(datos, "nombre");
  if (!nombre) return { error: "El ejercicio necesita un nombre." };

  const id = texto(datos, "id");
  const imagen = datos.get("imagen");
  const video = datos.get("video");

  let imagenUrl: string | null = texto(datos, "imagen_actual") || null;
  // El enlace escrito a mano tiene prioridad; si no hay, vale el archivo subido.
  let videoUrl: string | null =
    texto(datos, "video_url") || texto(datos, "video_actual") || null;

  try {
    const imagenSubida = await subirMedia(
      imagen instanceof File ? imagen : null,
      perfil.id
    );
    if (imagenSubida) imagenUrl = imagenSubida;

    const videoSubido = await subirMedia(
      video instanceof File ? video : null,
      perfil.id
    );
    if (videoSubido) videoUrl = videoSubido;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al subir el archivo." };
  }

  const campos = {
    nombre,
    grupo: texto(datos, "grupo") as GrupoMuscular,
    equipo: texto(datos, "equipo") || null,
    nivel: (texto(datos, "nivel") || "principiante") as NivelExperiencia,
    instrucciones: texto(datos, "instrucciones") || null,
    consejos: texto(datos, "consejos") || null,
    video_url: videoUrl,
    imagen_url: imagenUrl,
  };

  const { error } = id
    ? await supabase.from("ejercicios").update(campos).eq("id", id)
    : await supabase
        .from("ejercicios")
        .insert({ ...campos, creado_por: perfil.id, publico: true });

  if (error) return { error: error.message };

  revalidatePath("/entrenador/ejercicios");
  return { exito: id ? "Ejercicio actualizado." : "Ejercicio creado." };
}

/**
 * Borra un ejercicio de la biblioteca. No hay vuelta atrás.
 *
 * Devuelve el error en vez de lanzarlo: el más frecuente es que el
 * ejercicio esté programado en alguna rutina —la base lo impide— y decirlo
 * con palabras es más útil que una pantalla de error genérica.
 */
export async function borrarEjercicio(id: string): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const { count } = await supabase
    .from("rutina_ejercicios")
    .select("id", { count: "exact", head: true })
    .eq("ejercicio_id", id);

  if (count) {
    return {
      error: `Está programado en ${count} día${count === 1 ? "" : "s"} de rutina. Quítalo de ahí antes de borrarlo.`,
    };
  }

  const { error } = await supabase.from("ejercicios").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/entrenador/ejercicios");
  return { exito: "Ejercicio borrado." };
}

