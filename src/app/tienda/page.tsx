import type { Metadata } from "next";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { Navegacion } from "@/components/marketing/navegacion";
import { Pie } from "@/components/marketing/pie";
import { Auroras, Puntitos } from "@/components/brand/decoraciones";
import { Isotipo } from "@/components/brand/logo";
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

      <main className="relative overflow-hidden bg-gradient-to-b from-lila-100 via-crema to-crema pt-36 pb-24 md:pt-44">
        <Auroras />
        <Puntitos className="opacity-20" />
        <Isotipo className="animate-flotar absolute top-32 right-[6%] hidden h-20 opacity-[0.12] lg:block" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
          <header className="text-center">
            <p className="text-[11px] tracking-[0.28em] text-violeta-500 uppercase">
              Tienda
            </p>
            <h1 className="mt-4 text-4xl font-light text-violeta-900 md:text-6xl">
              Lleva <span className="font-script text-degradado text-5xl md:text-7xl">YIYO</span>{" "}
              contigo
            </h1>
            <p className="mx-auto mt-5 max-w-xl font-light text-violeta-900/65">
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
