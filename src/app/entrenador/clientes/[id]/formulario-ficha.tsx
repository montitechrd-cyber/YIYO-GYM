"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { actualizarCliente, type Resultado } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { ESTADOS_CLIENTE, NIVELES, OBJETIVOS } from "@/lib/etiquetas";
import type { Cliente } from "@/lib/supabase/tipos";

const inicial: Resultado = {};

export function FormularioFicha({ cliente }: { cliente: Cliente }) {
  const [estado, accion, pendiente] = useActionState(actualizarCliente, inicial);

  return (
    <form action={accion} className="space-y-5">
      <input type="hidden" name="id" value={cliente.id} />

      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado.exito && <Aviso tono="exito">{estado.exito}</Aviso>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Estado" htmlFor="estado">
          <Seleccion id="estado" name="estado" defaultValue={cliente.estado}>
            {Object.entries(ESTADOS_CLIENTE).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </Seleccion>
        </Campo>

        <Campo etiqueta="Origen" htmlFor="origen">
          <Entrada
            id="origen"
            name="origen"
            defaultValue={cliente.origen ?? ""}
            placeholder="Instagram, referida…"
          />
        </Campo>

        <Campo etiqueta="Objetivo" htmlFor="objetivo">
          <Seleccion id="objetivo" name="objetivo" defaultValue={cliente.objetivo ?? ""}>
            <option value="">Sin definir</option>
            {Object.entries(OBJETIVOS).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </Seleccion>
        </Campo>

        <Campo etiqueta="Nivel" htmlFor="nivel">
          <Seleccion id="nivel" name="nivel" defaultValue={cliente.nivel ?? ""}>
            <option value="">Sin definir</option>
            {Object.entries(NIVELES).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </Seleccion>
        </Campo>
      </div>

      <Campo
        etiqueta="Etiquetas"
        htmlFor="etiquetas"
        ayuda="Sepáralas con comas. Ej: postparto, principiante, casa"
      >
        <Entrada
          id="etiquetas"
          name="etiquetas"
          defaultValue={cliente.etiquetas.join(", ")}
          placeholder="postparto, casa, mañanas"
        />
      </Campo>

      <Campo etiqueta="Notas de la ficha" htmlFor="notas">
        <AreaTexto
          id="notas"
          name="notas"
          defaultValue={cliente.notas ?? ""}
          placeholder="Contexto general de esta clienta…"
        />
      </Campo>

      <Boton type="submit" disabled={pendiente}>
        {pendiente && <Loader2 size={15} className="animate-spin" />}
        {pendiente ? "Guardando…" : "Guardar cambios"}
      </Boton>
    </form>
  );
}
