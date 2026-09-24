"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { entrar, type EstadoFormulario } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";

const inicial: EstadoFormulario = {};

export function FormularioEntrar() {
  const [estado, accion, pendiente] = useActionState(entrar, inicial);
  const [verClave, setVerClave] = useState(false);

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
        <div className="relative">
          <Entrada
            id="contrasena"
            name="contrasena"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-violeta-500 transition-colors hover:text-violeta-700"
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verClave ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Campo>

      <div className="flex justify-end">
        <Link
          href="/recuperar"
          className="text-xs font-light text-violeta-600 underline-offset-4 hover:underline"
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
