"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { cambiarContrasena, type EstadoFormulario } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";

const inicial: EstadoFormulario = {};

export function FormularioNuevaContrasena() {
  const [estado, accion, pendiente] = useActionState(cambiarContrasena, inicial);

  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

      <Campo etiqueta="Nueva contraseña" htmlFor="contrasena" ayuda="Mínimo 8 caracteres.">
        <Entrada
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
        />
      </Campo>

      <Campo etiqueta="Repetir contraseña" htmlFor="repetir">
        <Entrada
          id="repetir"
          name="repetir"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          required
        />
      </Campo>

      <Boton type="submit" tamano="lg" className="w-full" disabled={pendiente}>
        {pendiente && <Loader2 size={16} className="animate-spin" />}
        {pendiente ? "Guardando…" : "Guardar contraseña"}
      </Boton>
    </form>
  );
}
