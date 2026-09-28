import Link from "next/link";
import type { Metadata } from "next";
import { FormularioRecuperar } from "./formulario";
import { Aviso } from "@/components/ui/aviso";

export const metadata: Metadata = { title: "Recuperar contraseña — YIYO GYM" };

export default async function PaginaRecuperar({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="text-4xl font-light text-violeta-900">
        Recuperar <span className="font-script text-degradado">acceso</span>
      </h1>
      <p className="mt-3 text-sm font-light text-violeta-900/60">
        Escribe tu correo y te enviamos un enlace para crear una contraseña nueva.
      </p>

      {error && <Aviso tono="error" className="mt-7">{error}</Aviso>}
      <div className="mt-9">
        <FormularioRecuperar />
      </div>

      <p className="mt-8 text-center text-sm font-light text-violeta-900/60">
        <Link
          href="/entrar"
          className="font-medium text-violeta-600 underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
