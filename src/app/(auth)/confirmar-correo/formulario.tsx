"use client";

import { useActionState } from "react";
import { reenviarConfirmacion, type EstadoFormulario } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";

const inicial: EstadoFormulario = {};

export function FormularioConfirmarCorreo() {
  const [estado, accion, pendiente] = useActionState(reenviarConfirmacion, inicial);
  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado.exito && <Aviso tono="exito">{estado.exito}</Aviso>}
      <Campo etiqueta="Correo electrónico" htmlFor="correo">
        <Entrada id="correo" name="correo" type="email" autoComplete="email" placeholder="tu@correo.com" required />
      </Campo>
      <Boton type="submit" tamano="lg" className="w-full" disabled={pendiente}>
        {pendiente ? "Enviando…" : "Reenviar confirmación"}
      </Boton>
    </form>
  );
}
