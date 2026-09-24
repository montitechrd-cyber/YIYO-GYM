"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirPerfil } from "@/lib/autenticacion";

export type Resultado = { error?: string; exito?: string };

export async function actualizarPerfil(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirPerfil();
  const supabase = await crearClienteServidor();

  const texto = (campo: string) => {
    const v = datos.get(campo);
    return typeof v === "string" ? v.trim() : "";
  };

  const nombre = texto("nombre_completo");
  if (!nombre) return { error: "El nombre no puede quedar vacío." };

  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre_completo: nombre,
      telefono: texto("telefono") || null,
      fecha_nacimiento: texto("fecha_nacimiento") || null,
      genero: texto("genero") || null,
      ciudad: texto("ciudad") || null,
      bio: texto("bio") || null,
    })
    .eq("id", perfil.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { exito: "Perfil actualizado." };
}
