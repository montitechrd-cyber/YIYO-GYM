import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { mapaPerfiles, nombreVisible } from "@/lib/datos";
import { Encabezado, Tarjeta } from "@/components/panel/piezas";
import { Aviso } from "@/components/ui/aviso";
import { FormularioEvaluacion } from "@/components/panel/formulario-evaluacion";
import type { Evaluacion } from "@/lib/supabase/tipos";

export default async function NuevaEvaluacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { id } = await params;

  const supabase = await crearClienteServidor();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) notFound();

  // Si la clienta ya envió su evaluación desde el registro, se completa —
  // sobre todo con las medidas, que solo toma la entrenadora— en vez de
  // crear una segunda evaluación aparte con los datos duplicados.
  const { data: evaluaciones } = await supabase
    .from("evaluaciones")
    .select("*")
    .eq("cliente_id", id)
    .order("fecha", { ascending: false })
    .limit(1)
    .returns<Evaluacion[]>();

  const evaluacion = evaluaciones?.[0] ?? null;
  const perfiles = await mapaPerfiles([cliente.perfil_id]);

  return (
    <div>
      <Link
        href={`/entrenador/clientes/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-xs font-light text-violeta-600 transition-colors hover:text-violeta-800"
      >
        <ArrowLeft size={14} />
        Volver a la ficha
      </Link>

      <Encabezado
        titulo="Evaluación"
        descripcion={`${evaluacion ? "Completando" : "Registrando"} datos de ${nombreVisible(perfiles.get(cliente.perfil_id))}`}
      />

      {evaluacion && (
        <Aviso tono="info" className="mb-6">
          Ya envió su evaluación desde el registro. Toma sus medidas y ajusta
          lo que haga falta — se guarda todo junto, no se crea una nueva.
        </Aviso>
      )}

      <Tarjeta>
        <FormularioEvaluacion
          clienteId={id}
          evaluacion={evaluacion}
          objetivoActual={cliente.objetivo}
          nivelActual={cliente.nivel}
          textoBoton={evaluacion ? "Guardar cambios" : "Guardar evaluación"}
        />
      </Tarjeta>
    </div>
  );
}
