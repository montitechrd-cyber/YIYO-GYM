"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { crearRutina, type Resultado } from "../acciones";
import { Boton } from "@/components/ui/boton";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { hoyTexto } from "@/lib/programacion";

const inicial: Resultado = {};

export function FormularioRutina({
  clientes,
  clientePreseleccionado,
}: {
  clientes: { id: string; nombre: string }[];
  clientePreseleccionado?: string;
}) {
  const [estado, accion, pendiente] = useActionState(crearRutina, inicial);

  return (
    <form action={accion} className="space-y-5">
      {estado.error && <Aviso tono="error">{estado.error}</Aviso>}

      <Campo etiqueta="Nombre de la rutina" htmlFor="nombre">
        <Entrada
          id="nombre"
          name="nombre"
          placeholder="Fuerza glúteo — Bloque 1"
          required
        />
      </Campo>

      <Campo etiqueta="Descripción" htmlFor="descripcion">
        <AreaTexto
          id="descripcion"
          name="descripcion"
          className="min-h-20"
          placeholder="Objetivo de este bloque, en qué enfocarse…"
        />
      </Campo>

      <Campo
        etiqueta="Asignar a clienta"
        htmlFor="cliente_id"
        ayuda="Si la dejas vacía se guarda como plantilla reutilizable."
      >
        <Seleccion
          id="cliente_id"
          name="cliente_id"
          defaultValue={clientePreseleccionado ?? ""}
        >
          <option value="">Guardar como plantilla</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Seleccion>
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Días por semana" htmlFor="dias_por_semana">
          <Seleccion id="dias_por_semana" name="dias_por_semana" defaultValue="3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {d} {d === 1 ? "día" : "días"}
              </option>
            ))}
          </Seleccion>
        </Campo>

        <Campo etiqueta="Duración (semanas)" htmlFor="semanas">
          <Seleccion id="semanas" name="semanas" defaultValue="4">
            {[2, 4, 6, 8, 12].map((s) => (
              <option key={s} value={s}>
                {s} semanas
              </option>
            ))}
          </Seleccion>
        </Campo>
      </div>

      <Campo
        etiqueta="Empezar la semana del"
        htmlFor="fecha_inicio"
        ayuda="Si asignas la rutina a una clienta, las sesiones se crean solas en su calendario a partir del lunes de esa semana."
      >
        <Entrada
          id="fecha_inicio"
          name="fecha_inicio"
          type="date"
          defaultValue={hoyTexto()}
        />
      </Campo>

      <Boton type="submit" tamano="lg" disabled={pendiente}>
        {pendiente && <Loader2 size={16} className="animate-spin" />}
        {pendiente ? "Creando…" : "Crear rutina"}
      </Boton>
    </form>
  );
}
