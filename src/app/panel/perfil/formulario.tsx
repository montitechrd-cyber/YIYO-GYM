"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { actualizarPerfil, type Resultado } from "./acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import type { Perfil } from "@/lib/supabase/tipos";

const inicial: Resultado = {};

export function FormularioPerfil({ perfil }: { perfil: Perfil }) {
  const [estado, accion, pendiente] = useActionState(actualizarPerfil, inicial);

  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado.exito && <Aviso tono="exito">{estado.exito}</Aviso>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Nombre completo" htmlFor="nombre_completo">
          <Entrada
            id="nombre_completo"
            name="nombre_completo"
            defaultValue={perfil.nombre_completo}
            required
          />
        </Campo>

        <Campo etiqueta="Correo" htmlFor="correo" ayuda="No se puede cambiar aquí.">
          <Entrada id="correo" defaultValue={perfil.correo} disabled />
        </Campo>

        <Campo etiqueta="Teléfono" htmlFor="telefono">
          <Entrada
            id="telefono"
            name="telefono"
            type="tel"
            defaultValue={perfil.telefono ?? ""}
            placeholder="809 123 4567"
          />
        </Campo>

        <Campo etiqueta="Fecha de nacimiento" htmlFor="fecha_nacimiento">
          <Entrada
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            defaultValue={perfil.fecha_nacimiento ?? ""}
          />
        </Campo>

        <Campo etiqueta="Género" htmlFor="genero">
          <Seleccion id="genero" name="genero" defaultValue={perfil.genero ?? ""}>
            <option value="">Prefiero no decirlo</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
            <option value="otro">Otro</option>
          </Seleccion>
        </Campo>

        <Campo etiqueta="Ciudad" htmlFor="ciudad">
          <Entrada
            id="ciudad"
            name="ciudad"
            defaultValue={perfil.ciudad ?? ""}
            placeholder="Santo Domingo"
          />
        </Campo>
      </div>

      <Campo etiqueta="Sobre mí" htmlFor="bio">
        <AreaTexto
          id="bio"
          name="bio"
          defaultValue={perfil.bio ?? ""}
          placeholder="Cuéntanos un poco de ti…"
        />
      </Campo>

      <Boton type="submit" disabled={pendiente}>
        {pendiente && <Loader2 size={15} className="animate-spin" />}
        {pendiente ? "Guardando…" : "Guardar cambios"}
      </Boton>
    </form>
  );
}
