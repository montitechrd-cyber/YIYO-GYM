"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clienteActual, exigirPerfil } from "@/lib/autenticacion";
import { hoyTexto } from "@/lib/programacion";

export type Resultado = { error?: string };

/** La clienta marca o desmarca una comida del día. */
export async function marcarComida(
  comidaId: string,
  cumplida: boolean,
  fecha?: string
): Promise<Resultado> {
  const perfil = await exigirPerfil();
  const cliente = await clienteActual(perfil.id);
  if (!cliente) return { error: "No encontramos tu ficha." };

  const supabase = await crearClienteServidor();
  const dia = fecha || hoyTexto();

  const { error } = await supabase.from("registro_comidas").upsert(
    {
      cliente_id: cliente.id,
      comida_id: comidaId,
      fecha: dia,
      cumplida,
    },
    { onConflict: "cliente_id,comida_id,fecha" }
  );

  if (error) return { error: error.message };

  revalidatePath("/panel/alimentacion");
  revalidatePath("/panel");
  return {};
}
