"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { recuperar, type EstadoFormulario } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";

const inicial: EstadoFormulario = {};

export function FormularioRecuperar() {
  const [estado, accion, pendiente] = useActionState(recuperar, inicial);

  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado.exito && <Aviso tono="exito">{estado.exito}</Aviso>}

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

      <Boton type="submit" tamano="lg" className="w-full" disabled={pendiente}>
        {pendiente && <Loader2 size={16} className="animate-spin" />}
        {pendiente ? "Enviando…" : "Enviar enlace"}
      </Boton>
    </form>
  );
}
