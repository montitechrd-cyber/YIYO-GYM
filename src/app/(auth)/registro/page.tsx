import Link from "next/link";
import type { Metadata } from "next";
import { FormularioRegistro } from "./formulario";
import { AccesoSocial } from "@/components/panel/acceso-social";

export const metadata: Metadata = { title: "Crear cuenta — YIYO GYM" };

export default function PaginaRegistro() {
  return (
    <div>
      <h1 className="text-[clamp(2.5rem,13vw,3.75rem)] break-words text-violeta-900">
        Empieza tu <span className="text-violeta-600">transformación</span>
      </h1>
      <p className="mt-3 text-sm text-violeta-900/75">
        Crea tu cuenta gratis. Después completas tu evaluación inicial y recibes tu
        primer plan.
      </p>

      <div className="mt-9 space-y-6">
        <AccesoSocial texto="Continuar con" />
        <FormularioRegistro />
      </div>

      <p className="mt-8 text-center text-sm text-violeta-900/75">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/entrar"
          className="font-semibold text-violeta-700 underline underline-offset-4 hover:underline"
        >
          Entra aquí
        </Link>
      </p>
    </div>
  );
}
