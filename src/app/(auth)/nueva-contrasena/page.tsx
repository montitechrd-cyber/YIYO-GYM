import type { Metadata } from "next";
import { FormularioNuevaContrasena } from "./formulario";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Nueva contraseña — YIYO GYM" };

export default async function PaginaNuevaContrasena({ searchParams }: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const parametros = await searchParams;
  // Compatibilidad con los correos anteriores que volvían directamente aquí.
  if (parametros.code) {
    const destino = new URLSearchParams({ code: parametros.code, siguiente: "/nueva-contrasena" });
    redirect(`/auth/callback?${destino}`);
  }
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (parametros.error || !user) {
    redirect(`/recuperar?error=${encodeURIComponent("Abre el enlace más reciente de tu correo. Si venció o ya lo usaste, solicita uno nuevo.")}`);
  }
  return (
    <div>
      <h1 className="text-4xl font-light text-violeta-900">
        Crea tu <span className="font-script text-degradado">nueva clave</span>
      </h1>
      <p className="mt-3 text-sm font-light text-violeta-900/60">
        Elige una contraseña que recuerdes y que nadie más pueda adivinar.
      </p>

      <div className="mt-9">
        <FormularioNuevaContrasena />
      </div>
    </div>
  );
}
