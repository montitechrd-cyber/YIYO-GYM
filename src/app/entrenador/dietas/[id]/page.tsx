import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { clientesConPerfil, nombreVisible } from "@/lib/datos";
import { planCompleto } from "@/lib/dietas";
import { Insignia } from "@/components/panel/piezas";
import { ConstructorDieta } from "./constructor";
import { EditorObjetivos } from "./objetivos";

export default async function DetalleDieta({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { id } = await params;

  const supabase = await crearClienteServidor();
  const [contenido, { data: alimentos }, clientes] = await Promise.all([
    planCompleto(id),
    supabase.from("alimentos").select("*").order("nombre"),
    clientesConPerfil(),
  ]);

  if (!contenido) notFound();

  const { plan } = contenido;
  const nombreCliente = nombreVisible(
    clientes.find((c) => c.id === plan.cliente_id)?.perfil
  );

  const totalSemana = contenido.dias.reduce(
    (t, d) => t + d.macros.calorias,
    0
  );
  const diasConContenido = contenido.dias.filter(
    (d) => d.macros.calorias > 0
  ).length;

  return (
    <div>
      <Link
        href="/entrenador/dietas"
        className="mb-6 inline-flex items-center gap-2 text-xs font-light text-violeta-600 transition-colors hover:text-violeta-800"
      >
        <ArrowLeft size={14} />
        Volver a dietas
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-violeta-900">{plan.nombre}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-light text-violeta-900/55">
            <User size={14} className="text-lila-400" />
            {nombreCliente}
            {diasConContenido > 0 && (
              <>
                {" · "}
                {diasConContenido} de 7 días armados · media de{" "}
                {Math.round(totalSemana / Math.max(diasConContenido, 1))} kcal
              </>
            )}
          </p>
          {plan.descripcion && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed font-light text-violeta-900/65">
              {plan.descripcion}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Insignia tono={plan.activo ? "verde" : "gris"}>
            {plan.activo ? "Activa" : "Inactiva"}
          </Insignia>
          <EditorObjetivos plan={plan} />
        </div>
      </header>

      <ConstructorDieta contenido={contenido} alimentos={alimentos ?? []} />
    </div>
  );
}
