import Link from "next/link";
import type { Metadata } from "next";
import { Aviso } from "@/components/ui/aviso";
import { FormularioConfirmarCorreo } from "./formulario";

export const metadata: Metadata = { title: "Confirmar correo — YIYO GYM" };

export default async function PaginaConfirmarCorreo({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="text-4xl font-light text-violeta-900">Confirma tu <span className="font-script text-degradado">correo</span></h1>
      <p className="mt-3 text-sm font-light text-violeta-900/60">Si no recibiste el correo de activación o el enlace venció, solicita uno nuevo aquí.</p>
      {error && <Aviso tono="error" className="mt-7">{error}</Aviso>}
      <div className="mt-9"><FormularioConfirmarCorreo /></div>
      <p className="mt-8 text-center text-sm text-violeta-600"><Link href="/entrar" className="hover:underline">Volver a iniciar sesión</Link></p>
    </div>
  );
}
