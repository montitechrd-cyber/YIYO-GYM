"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { rutaInicio } from "@/lib/autenticacion";

export type EstadoFormulario = { error?: string; exito?: string };

function faltanCredenciales() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const AVISO_CONFIG =
  "La conexión con Supabase no está configurada. Revisa el archivo SUPABASE_SETUP.md y completa .env.local.";

export async function entrar(
  _previo: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  if (faltanCredenciales()) return { error: AVISO_CONFIG };

  const correo = String(datos.get("correo") ?? "").trim();
  const contrasena = String(datos.get("contrasena") ?? "");

  if (!correo || !contrasena) return { error: "Completa tu correo y contraseña." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message,
    };
  }

  // Con verificación en dos pasos activada, la contraseña sola deja la
  // sesión a medias (aal1): falta el código de la app para completarla.
  const { data: nivel } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  revalidatePath("/", "layout");

  if (nivel?.nextLevel === "aal2" && nivel.nextLevel !== nivel.currentLevel) {
    redirect("/verificar");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user!.id)
    .single();

  redirect(rutaInicio(perfil?.rol ?? "cliente"));
}

export async function registrar(
  _previo: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  if (faltanCredenciales()) return { error: AVISO_CONFIG };

  const nombre = String(datos.get("nombre") ?? "").trim();
  const correo = String(datos.get("correo") ?? "").trim();
  const contrasena = String(datos.get("contrasena") ?? "");
  const repetir = String(datos.get("repetir") ?? "");

  if (!nombre || !correo || !contrasena) {
    return { error: "Completa todos los campos." };
  }
  if (contrasena.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (contrasena !== repetir) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password: contrasena,
    options: { data: { nombre_completo: nombre, rol: "cliente" } },
  });

  if (error) return { error: error.message };

  // Con la confirmación de correo activada todavía no hay sesión: la cuenta
  // queda en pie pero dormida hasta que se pincha el enlace. La ficha de
  // clienta se crea entonces, en `/auth/confirm`, y no aquí: crearla ahora
  // llenaría el CRM de expedientes de direcciones que nadie confirmó.
  if (!data.session) {
    return {
      exito:
        "Te enviamos un correo a " +
        correo +
        ". Abre el enlace para activar tu cuenta y entras directo.",
    };
  }

  // Crea la ficha de CRM del nuevo cliente.
  await supabase.from("clientes").insert({
    perfil_id: data.user!.id,
    estado: "prospecto",
    origen: "registro web",
  });

  revalidatePath("/", "layout");
  redirect("/panel/bienvenida");
}

export async function recuperar(
  _previo: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  if (faltanCredenciales()) return { error: AVISO_CONFIG };

  const correo = String(datos.get("correo") ?? "").trim();
  if (!correo) return { error: "Escribe tu correo." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/nueva-contrasena`,
  });

  if (error) return { error: error.message };
  return {
    exito: "Si el correo existe, te enviamos un enlace para restablecer tu contraseña.",
  };
}

export async function cambiarContrasena(
  _previo: EstadoFormulario,
  datos: FormData
): Promise<EstadoFormulario> {
  const contrasena = String(datos.get("contrasena") ?? "");
  const repetir = String(datos.get("repetir") ?? "");

  if (contrasena.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (contrasena !== repetir) return { error: "Las contraseñas no coinciden." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: contrasena });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/panel");
}

export async function salir() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}
