"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { registrar, type EstadoFormulario } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";

const inicial: EstadoFormulario = {};

export function FormularioRegistro() {
  const [estado, accion, pendiente] = useActionState(registrar, inicial);
  const [verClave, setVerClave] = useState(false);

  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado.exito && <Aviso tono="exito">{estado.exito}</Aviso>}

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
        <div className="relative">
          <Entrada
            id="contrasena"
            name="contrasena"
            type={verClave ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pr-12"
            minLength={8}
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

      <Campo etiqueta="Repetir contraseña" htmlFor="repetir">
        <Entrada
          id="repetir"
          name="repetir"
          type={verClave ? "text" : "password"}
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

      <p className="text-center text-[11px] leading-relaxed font-light text-violeta-900/45">
        Al crear tu cuenta aceptas nuestros términos de servicio y política de
        privacidad.
      </p>
    </form>
  );
}
