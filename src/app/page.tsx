import { Navegacion } from "@/components/marketing/navegacion";
import { Hero } from "@/components/marketing/hero";
import { Valores } from "@/components/marketing/valores";
import { Metodo } from "@/components/marketing/metodo";
import { SobreYiyo } from "@/components/marketing/sobre-yiyo";
import { Planes } from "@/components/marketing/planes";
import { Historias } from "@/components/marketing/historias";
import { Comienza } from "@/components/marketing/comienza";
import { Pie } from "@/components/marketing/pie";

export default function Inicio() {
  return (
    <>
      <Navegacion />
      <main>
        <Hero />
        <Valores />
        <Metodo />
        <SobreYiyo />
        <Planes />
        <Historias />
        <Comienza />
      </main>
      <Pie />
    </>
  );
}
