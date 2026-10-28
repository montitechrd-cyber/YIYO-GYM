import type { Metadata } from "next";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Navegacion } from "@/components/marketing/navegacion";
import { Pie } from "@/components/marketing/pie";
import { Catalogo } from "./catalogo";

export const metadata: Metadata = {
  title: "Tienda — YIYO GYM",
  description:
    "Ropa deportiva, accesorios y equipamiento con la identidad YIYO GYM. Elige lo tuyo y haz tu pedido por WhatsApp.",
};

export default async function Tienda() {
  const supabase = await crearClienteServidor();
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("orden");

  // Se agrupan por categoría conservando el orden del catálogo.
  const categorias: string[] = [];
  for (const p of productos ?? []) {
    if (!categorias.includes(p.categoria)) categorias.push(p.categoria);
  }

  return (
    <>
      {/* Sin los enlaces de la portada: son anclas y desde aquí no van a
          ningún sitio. Solo la vuelta al inicio. */}
      <Navegacion soloInicio />

      <main className="bg-crema pt-24 pb-16 sm:pt-28 sm:pb-24 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <header className="flex flex-col justify-between gap-5 border-b-2 border-violeta-900 pb-8 md:flex-row md:items-end">
            <h1 className="text-[clamp(2.75rem,12vw,6rem)] break-words text-violeta-900">
              Lleva <span className="text-violeta-600">YIYO</span> contigo
            </h1>
            <p className="max-w-sm text-base leading-7 text-violeta-900/80">
              Elige lo tuyo, arma tu pedido y me llega directo por WhatsApp.
              Coordinamos entrega y pago por ahí mismo
            </p>
          </header>

          <Catalogo productos={productos ?? []} categorias={categorias} />
        </div>
      </main>

      <Pie />
    </>
  );
}
