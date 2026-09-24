import Link from "next/link";
import type { Metadata } from "next";
import { FormularioEntrar } from "./formulario";
import { AccesoSocial } from "@/components/panel/acceso-social";
import { Aviso } from "@/components/ui/aviso";

export const metadata: Metadata = { title: "Entrar — YIYO GYM" };

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Los accesos sociales que fallan vuelven aquí con el motivo en la URL.
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-4xl font-light text-violeta-900">
        Hola de nuevo <span className="font-script text-degradado">✿</span>
      </h1>
      <p className="mt-3 text-sm font-light text-violeta-900/60">
        Entra a tu cuenta y sigue justo donde lo dejaste.
      </p>

      {error && (
        <Aviso tono="error" className="mt-7">
          {error}
        </Aviso>
      )}

      <div className="mt-9 space-y-6">
        <AccesoSocial texto="Entrar con" />
        <FormularioEntrar />
      </div>

      <p className="mt-8 text-center text-sm font-light text-violeta-900/60">
        ¿Todavía no tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-medium text-violeta-600 underline-offset-4 hover:underline"
        >
          Empieza aquí
        </Link>
      </p>
    </div>
  );
}
