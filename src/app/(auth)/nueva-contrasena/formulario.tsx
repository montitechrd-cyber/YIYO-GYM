"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { cambiarContrasena, type EstadoFormulario } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { EntradaClave } from "@/components/ui/entrada-clave";
import { Aviso } from "@/components/ui/aviso";

const inicial: EstadoFormulario = {};

export function FormularioNuevaContrasena() {
  const [estado, accion, pendiente] = useActionState(cambiarContrasena, inicial);

  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

      <Campo etiqueta="Nueva contraseña" htmlFor="contrasena" ayuda="Mínimo 8 caracteres.">
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
        {pendiente ? "Guardando…" : "Guardar contraseña"}
      </Boton>
    </form>
  );
}
