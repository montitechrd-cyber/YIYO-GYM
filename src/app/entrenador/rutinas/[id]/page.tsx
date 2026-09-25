import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clientesConPerfil, nombreVisible } from "@/lib/datos";
import { rutinaConDias } from "@/lib/rutinas";
import { Insignia } from "@/components/panel/piezas";
import { TarjetaProgresion } from "@/components/panel/progresion";
import { EditorRutina } from "./editor";
import { ProgramarRutina } from "./programar";

export default async function DetalleRutina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { id } = await params;

  const supabase = await crearClienteServidor();

  // Rutina completa, catálogo de ejercicios y fichas: todo en paralelo.
  const [contenido, { data: ejercicios }, clientes] = await Promise.all([
    rutinaConDias(id),
    // Solo los que están en la biblioteca: los apartados no deben poder
    // colarse al armar un día. Se devuelven desde la biblioteca, no desde
    // aquí.
    supabase.from("ejercicios").select("*").eq("publico", true).order("nombre"),
    clientesConPerfil(),
  ]);

  if (!contenido) notFound();

  const { rutina, dias: listaDias } = contenido;
  const nombreCliente = rutina.cliente_id
    ? nombreVisible(clientes.find((c) => c.id === rutina.cliente_id)?.perfil)
    : null;

  // Los bloques ya vienen dentro de cada día; se agrupan por día para el editor.
  const bloquesPorDia = Object.fromEntries(
    listaDias.map((d) => [d.id, d.bloques])
  );

  return (
    <div>
      <Link
        href="/entrenador/rutinas"
        className="mb-6 inline-flex items-center gap-2 text-xs font-light text-violeta-600 transition-colors hover:text-violeta-800"
      >
        <ArrowLeft size={14} />
        Volver a rutinas
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-violeta-900">{rutina.nombre}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-light text-violeta-900/55">
            <User size={14} className="text-lila-400" />
            {nombreCliente ?? "Plantilla sin asignar"} · {rutina.dias_por_semana}{" "}
            días/semana · {rutina.semanas} semanas
          </p>
          {rutina.descripcion && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed font-light text-violeta-900/65">
              {rutina.descripcion}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Insignia tono={rutina.es_plantilla ? "lila" : "verde"}>
            {rutina.es_plantilla ? "Plantilla" : "Asignada"}
          </Insignia>
          {rutina.cliente_id && (
            <ProgramarRutina
              rutinaId={rutina.id}
              semanas={rutina.semanas}
              dias={listaDias.length}
            />
          )}
        </div>
      </header>

      <TarjetaProgresion
        fechaInicio={rutina.fecha_inicio}
        detallada
        className="mb-8"
      />

      <EditorRutina
        rutinaId={rutina.id}
        dias={listaDias}
        bloquesPorDia={bloquesPorDia}
        ejercicios={ejercicios ?? []}
      />
    </div>
  );
}
