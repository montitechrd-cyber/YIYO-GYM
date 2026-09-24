"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/autenticacion";
import type { RolUsuario } from "@/lib/supabase/tipos";

export type Resultado = { error?: string; exito?: string };

function texto(datos: FormData, campo: string) {
  const v = datos.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

export async function cambiarRol(perfilId: string, rol: RolUsuario) {
  const admin = await exigirRol("admin");
  if (perfilId === admin.id) {
    throw new Error("No puedes cambiar tu propio rol.");
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("perfiles")
    .update({ rol })
    .eq("id", perfilId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}

export async function guardarPlan(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();

  const nombre = texto(datos, "nombre");
  const precio = Number(texto(datos, "precio_mensual"));

  if (!nombre) return { error: "El plan necesita un nombre." };
  if (!Number.isFinite(precio) || precio < 0) {
    return { error: "El precio no es válido." };
  }

  const beneficios = texto(datos, "beneficios")
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  const campos = {
    nombre,
    descripcion: texto(datos, "descripcion") || null,
    precio_mensual: precio,
    beneficios,
    paypal_plan_id: texto(datos, "paypal_plan_id") || null,
    destacado: datos.get("destacado") === "on",
    activo: datos.get("activo") === "on",
    orden: Number(texto(datos, "orden")) || 0,
  };

  const id = texto(datos, "id");
  const { error } = id
    ? await supabase.from("planes").update(campos).eq("id", id)
    : await supabase.from("planes").insert(campos);

  if (error) return { error: error.message };

  revalidatePath("/admin/planes");
  revalidatePath("/panel/suscripcion");
  return { exito: id ? "Plan actualizado." : "Plan creado." };
}

export async function borrarPlan(id: string) {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("planes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/planes");
}
