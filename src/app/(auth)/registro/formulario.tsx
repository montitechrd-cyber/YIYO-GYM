"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registrar, type EstadoFormulario } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { EntradaClave } from "@/components/ui/entrada-clave";
import { Aviso } from "@/components/ui/aviso";

const inicial: EstadoFormulario = {};

export function FormularioRegistro() {
  const [estado, accion, pendiente] = useActionState(registrar, inicial);

  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado.exito && <Aviso tono="exito">{estado.exito}<Link href="/confirmar-correo" className="mt-3 block underline">Reenviar confirmación</Link></Aviso>}

      <Campo etiqueta="Nombre completo" htmlFor="nombre">
        <Entrada
          id="nombre"
          name="nombre"
          autoComplete="name"
          placeholder="Daniela Chacón"
          required
        />
      </Campo>

      <Campo etiqueta="Correo electrónico" htmlFor="correo">
        <Entrada
          id="correo"
          name="correo"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
        />
      </Campo>

      <Campo
        etiqueta="Contraseña"
        htmlFor="contrasena"
        ayuda="Mínimo 8 caracteres."
      >
        <EntradaClave
          id="contrasena"
          name="contrasena"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
        />
      </Campo>

      <Campo etiqueta="Repetir contraseña" htmlFor="repetir">
        <EntradaClave
          id="repetir"
          name="repetir"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
        />
      </Campo>

      <Boton type="submit" tamano="lg" className="w-full" disabled={pendiente}>
        {pendiente && <Loader2 size={16} className="animate-spin" />}
        {pendiente ? "Creando tu cuenta…" : "Crear mi cuenta"}
      </Boton>

      <p className="text-center text-[11px] leading-relaxed font-normal text-violeta-900/45">
        Al crear tu cuenta aceptas nuestros términos de servicio y política de
        privacidad.
      </p>
    </form>
  );
}
