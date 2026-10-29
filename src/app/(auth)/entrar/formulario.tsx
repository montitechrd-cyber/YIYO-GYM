"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { entrar, type EstadoFormulario } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { EntradaClave } from "@/components/ui/entrada-clave";
import { Aviso } from "@/components/ui/aviso";

const inicial: EstadoFormulario = {};

export function FormularioEntrar() {
  const [estado, accion, pendiente] = useActionState(entrar, inicial);

  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

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

      <Campo etiqueta="Contraseña" htmlFor="contrasena">
        <EntradaClave
          id="contrasena"
          name="contrasena"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Campo>

      <div className="flex justify-end">
        <Link
          href="/recuperar"
          className="text-xs font-normal text-violeta-600 underline-offset-4 hover:underline"
        >
          Olvidé mi contraseña
        </Link>
      </div>

      <Boton type="submit" tamano="lg" className="w-full" disabled={pendiente}>
        {pendiente && <Loader2 size={16} className="animate-spin" />}
        {pendiente ? "Entrando…" : "Entrar"}
      </Boton>
    </form>
  );
}
