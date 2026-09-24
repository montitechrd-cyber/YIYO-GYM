import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { clientesConSugerencia } from "@/lib/dietas";
import { Encabezado, Tarjeta } from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { FormularioDieta } from "./formulario";

export type { ClienteConSugerencia as ClienteParaDieta } from "@/lib/dietas";

export default async function NuevaDieta({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { cliente = "" } = await searchParams;

  const clientes = await clientesConSugerencia();

  return (
    <div className="max-w-3xl">
      <Link
        href="/entrenador/dietas"
        className="mb-6 inline-flex items-center gap-2 text-xs font-light text-violeta-600 transition-colors hover:text-violeta-800"
      >
        <ArrowLeft size={14} />
        Volver a dietas
      </Link>

      <Encabezado
        titulo="Nueva dieta desde cero"
        descripcion="Solo si necesitas algo a medida. Para lo habitual hay planes ya armados"
        acciones={
          <BotonEnlace href="/entrenador/dietas" variante="contorno">
            <Sparkles size={16} />
            Ver el catálogo de dietas
          </BotonEnlace>
        }
      />

      <Tarjeta>
        <FormularioDieta clientes={clientes} clientePreseleccionado={cliente} />
      </Tarjeta>
    </div>
  );
}
