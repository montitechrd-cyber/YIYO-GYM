"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/autenticacion";
import { asegurarEntrenadora } from "@/lib/datos";
import { COMIDAS_POR_DEFECTO, DIAS_SEMANA } from "@/lib/nutricion";
import type { CategoriaAlimento, UnidadAlimento } from "@/lib/supabase/tipos";

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

// ---------------------------------------------------------------------
// Catálogo de alimentos
// ---------------------------------------------------------------------

export async function guardarAlimento(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const nombre = texto(datos, "nombre");
  if (!nombre) return { error: "El alimento necesita un nombre." };

  const campos = {
    nombre,
    categoria: (texto(datos, "categoria") || "otro") as CategoriaAlimento,
    unidad: (texto(datos, "unidad") || "g") as UnidadAlimento,
    calorias: numero(datos, "calorias") ?? 0,
    proteina_g: numero(datos, "proteina_g") ?? 0,
    carbohidratos_g: numero(datos, "carbohidratos_g") ?? 0,
    grasa_g: numero(datos, "grasa_g") ?? 0,
    fibra_g: numero(datos, "fibra_g") ?? 0,
    gramos_por_unidad: numero(datos, "gramos_por_unidad"),
    marca: texto(datos, "marca") || null,
  };

  const id = texto(datos, "id");
  const { error } = id
    ? await supabase.from("alimentos").update(campos).eq("id", id)
    : await supabase
        .from("alimentos")
        .insert({ ...campos, creado_por: perfil.id, publico: true });

  if (error) return { error: error.message };

  revalidatePath("/entrenador/alimentos");
  return { exito: id ? "Alimento actualizado." : "Alimento creado." };
}

export async function borrarAlimento(id: string) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("alimentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/entrenador/alimentos");
}

// ---------------------------------------------------------------------
// Planes de alimentación
// ---------------------------------------------------------------------

export async function crearPlanAlimentacion(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  const perfil = await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const nombre = texto(datos, "nombre");
  const clienteId = texto(datos, "cliente_id");
  if (!nombre) return { error: "El plan necesita un nombre." };
  if (!clienteId) return { error: "Elige la clienta." };

  await asegurarEntrenadora(clienteId, perfil.id);

  const { data: plan, error } = await supabase
    .from("planes_alimentacion")
    .insert({
      nombre,
      descripcion: texto(datos, "descripcion") || null,
      cliente_id: clienteId,
      entrenador_id: perfil.id,
      calorias_objetivo: numero(datos, "calorias_objetivo"),
      proteina_objetivo_g: numero(datos, "proteina_objetivo_g"),
      carbohidratos_objetivo_g: numero(datos, "carbohidratos_objetivo_g"),
      grasa_objetivo_g: numero(datos, "grasa_objetivo_g"),
    })
    .select()
    .single();

  if (error || !plan) return { error: error?.message ?? "No se pudo crear." };

  // Siete días con sus comidas típicas, listos para rellenar.
  const { data: dias } = await supabase
    .from("plan_dias")
    .insert(
      DIAS_SEMANA.map((nombreDia, i) => ({
        plan_id: plan.id,
        numero: i + 1,
        nombre: nombreDia,
      }))
    )
    .select();

  if (dias?.length) {
    await supabase.from("plan_comidas").insert(
      dias.flatMap((d) =>
        COMIDAS_POR_DEFECTO.map((c, i) => ({
          dia_id: d.id,
          nombre: c.nombre,
          hora: c.hora,
          orden: i,
        }))
      )
    );
  }

  const { data: cliente } = await supabase
    .from("clientes")
    .select("perfil_id")
    .eq("id", clienteId)
    .single();

  if (cliente) {
    await supabase.from("notificaciones").insert({
      perfil_id: cliente.perfil_id,
      tipo: "sistema",
      titulo: "Tienes un plan de alimentación",
      cuerpo: `Yiyo preparó «${nombre}» para ti.`,
      enlace: "/panel/alimentacion",
    });
  }

  revalidatePath("/entrenador/dietas");
  redirect(`/entrenador/dietas/${plan.id}`);
}

export async function actualizarObjetivos(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const id = texto(datos, "plan_id");
  if (!id) return { error: "Falta el plan." };

  const { error } = await supabase
    .from("planes_alimentacion")
    .update({
      calorias_objetivo: numero(datos, "calorias_objetivo"),
      proteina_objetivo_g: numero(datos, "proteina_objetivo_g"),
      carbohidratos_objetivo_g: numero(datos, "carbohidratos_objetivo_g"),
      grasa_objetivo_g: numero(datos, "grasa_objetivo_g"),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/entrenador/dietas/${id}`);
  revalidatePath("/panel/alimentacion");
  return { exito: "Objetivos guardados." };
}

export async function borrarPlanAlimentacion(id: string) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  await supabase.from("planes_alimentacion").delete().eq("id", id);
  revalidatePath("/entrenador/dietas");
  redirect("/entrenador/dietas");
}

// ---------------------------------------------------------------------
// Comidas e ingredientes
// ---------------------------------------------------------------------

export async function agregarComida(
  diaId: string,
  planId: string
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const { count } = await supabase
    .from("plan_comidas")
    .select("id", { count: "exact", head: true })
    .eq("dia_id", diaId);

  const { error } = await supabase
    .from("plan_comidas")
    .insert({ dia_id: diaId, nombre: "Comida", orden: count ?? 0 });

  if (error) return { error: error.message };
  revalidatePath(`/entrenador/dietas/${planId}`);
  return {};
}

export async function renombrarComida(
  comidaId: string,
  planId: string,
  nombre: string,
  hora: string | null
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  const limpio = nombre.trim();
  if (!limpio) return { error: "La comida necesita un nombre." };

  const { error } = await supabase
    .from("plan_comidas")
    .update({ nombre: limpio, hora: hora || null })
    .eq("id", comidaId);

  if (error) return { error: error.message };
  revalidatePath(`/entrenador/dietas/${planId}`);
  revalidatePath("/panel/alimentacion");
  return {};
}

export async function borrarComida(comidaId: string, planId: string) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  await supabase.from("plan_comidas").delete().eq("id", comidaId);
  revalidatePath(`/entrenador/dietas/${planId}`);
  revalidatePath("/panel/alimentacion");
}

export async function agregarIngrediente(
  _previo: Resultado,
  datos: FormData
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const comidaId = texto(datos, "comida_id");
  const alimentoId = texto(datos, "alimento_id");
  const planId = texto(datos, "plan_id");
  const cantidad = numero(datos, "cantidad");

  if (!alimentoId) return { error: "Elige un alimento." };
  if (!cantidad || cantidad <= 0) return { error: "Indica una cantidad válida." };

  const { count } = await supabase
    .from("comida_alimentos")
    .select("id", { count: "exact", head: true })
    .eq("comida_id", comidaId);

  const { error } = await supabase.from("comida_alimentos").insert({
    comida_id: comidaId,
    alimento_id: alimentoId,
    cantidad,
    orden: count ?? 0,
    notas: texto(datos, "notas") || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/entrenador/dietas/${planId}`);
  revalidatePath("/panel/alimentacion");
  return { exito: "Ingrediente añadido." };
}

export async function cambiarCantidad(
  ingredienteId: string,
  planId: string,
  cantidad: number
) {
  await exigirRol("entrenador", "admin");
  if (!Number.isFinite(cantidad) || cantidad <= 0) return;

  const supabase = await crearClienteServidor();
  await supabase
    .from("comida_alimentos")
    .update({ cantidad })
    .eq("id", ingredienteId);

  revalidatePath(`/entrenador/dietas/${planId}`);
  revalidatePath("/panel/alimentacion");
}

export async function quitarIngrediente(ingredienteId: string, planId: string) {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();
  await supabase.from("comida_alimentos").delete().eq("id", ingredienteId);
  revalidatePath(`/entrenador/dietas/${planId}`);
  revalidatePath("/panel/alimentacion");
}

/** Copia todas las comidas de un día en otro, para no repetir trabajo. */
export async function copiarDia(
  origenId: string,
  destinoId: string,
  planId: string
): Promise<Resultado> {
  await exigirRol("entrenador", "admin");
  const supabase = await crearClienteServidor();

  const { data: comidas } = await supabase
    .from("plan_comidas")
    .select("*")
    .eq("dia_id", origenId)
    .order("orden");

  if (!comidas?.length) return { error: "Ese día está vacío." };

  const { data: ingredientes } = await supabase
    .from("comida_alimentos")
    .select("*")
    .in(
      "comida_id",
      comidas.map((c) => c.id)
    );

  // Lo viejo del destino se apunta ahora pero se borra al final: si el
  // insert fallara, borrarlo antes dejaba el día destino vacío y sin vuelta
  // atrás.
  const { data: previas } = await supabase
    .from("plan_comidas")
    .select("id")
    .eq("dia_id", destinoId);

  // El `orden` se reasigna por posición para que sea único dentro del día:
  // es la clave con la que se emparejan después los ingredientes. Antes se
  // emparejaba por la posición del array devuelto por el insert, cuyo orden
  // no está garantizado, y los ingredientes podían caer en otra comida.
  const { data: nuevas, error } = await supabase
    .from("plan_comidas")
    .insert(
      comidas.map((c, i) => ({
        dia_id: destinoId,
        nombre: c.nombre,
        hora: c.hora,
        orden: i,
      }))
    )
    .select("id, orden");

  if (error) return { error: error.message };

  if (previas?.length) {
    await supabase
      .from("plan_comidas")
      .delete()
      .in(
        "id",
        previas.map((p) => p.id)
      );
  }

  const idPorOrden = new Map((nuevas ?? []).map((n) => [n.orden, n.id]));
  const equivalencia = new Map(comidas.map((c, i) => [c.id, idPorOrden.get(i)]));
  const copias = (ingredientes ?? []).flatMap((ing) => {
    const destino = equivalencia.get(ing.comida_id);
    return destino
      ? [
          {
            comida_id: destino,
            alimento_id: ing.alimento_id,
            cantidad: ing.cantidad,
            orden: ing.orden,
            notas: ing.notas,
          },
        ]
      : [];
  });

  if (copias.length) await supabase.from("comida_alimentos").insert(copias);

  revalidatePath(`/entrenador/dietas/${planId}`);
  revalidatePath("/panel/alimentacion");
  return { exito: "Día copiado." };
}
