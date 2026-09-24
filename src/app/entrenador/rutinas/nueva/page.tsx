import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { exigirRol } from "@/lib/autenticacion";
import { clientesConPerfil, nombreVisible } from "@/lib/datos";
import { Encabezado, Tarjeta } from "@/components/panel/piezas";
import { BotonEnlace } from "@/components/ui/boton";
import { FormularioRutina } from "./formulario";

export default async function NuevaRutina({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await exigirRol("entrenador", "admin");
  const { cliente = "" } = await searchParams;

  const clientes = await clientesConPerfil();
  const opciones = clientes.map((c) => ({
    id: c.id,
    nombre: nombreVisible(c.perfil),
  }));

  return (
    <div className="max-w-3xl">
      <Link
        href="/entrenador/rutinas"
        className="mb-6 inline-flex items-center gap-2 text-xs font-light text-violeta-600 transition-colors hover:text-violeta-800"
      >
        <ArrowLeft size={14} />
        Volver a rutinas
      </Link>

      <Encabezado
        titulo="Nueva rutina desde cero"
        descripcion="Solo si necesitas algo a medida. Para lo habitual hay programas ya armados"
        acciones={
          <BotonEnlace href="/entrenador/rutinas" variante="contorno">
            <Sparkles size={16} />
            Ver el catálogo de rutinas
          </BotonEnlace>
        }
      />

      <Tarjeta>
        <FormularioRutina clientes={opciones} clientePreseleccionado={cliente} />
      </Tarjeta>
    </div>
  );
}
