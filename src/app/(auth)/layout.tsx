import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      {/* Panel de marca: un bloque sólido de violeta con el lema a escala de cartel */}
      <aside className="hidden w-[46%] flex-col justify-between border-r border-violeta-900 bg-violeta-700 p-14 text-white lg:flex">
        <Link href="/">
          <Logo invertido />
        </Link>

        <div>
          <p className="font-display text-[5.5rem] leading-[0.9] font-extrabold uppercase [font-stretch:72%]">
            Tu mejor <span className="text-lila-300">versión</span>
          </p>
          <p className="mt-6 max-w-xs text-base leading-7 text-white/85">
            No se trata de ser la mejor. Se trata de ser tu mejor versión.
          </p>
        </div>

        <p className="border-t border-white/40 pt-5 text-xs font-semibold tracking-[0.18em] uppercase">
          Fuerza · Disciplina · Evolución
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex min-w-0 flex-1 items-center justify-center bg-crema px-5 py-10 sm:px-6 sm:py-14">
        <div className="w-full min-w-0 max-w-md">
          <Link
            href="/"
            className="mb-7 inline-flex sm:mb-9 items-center gap-2 text-xs font-semibold tracking-[0.12em] text-violeta-800 uppercase hover:underline"
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>

          <div className="mb-9 lg:hidden">
            <Logo />
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
