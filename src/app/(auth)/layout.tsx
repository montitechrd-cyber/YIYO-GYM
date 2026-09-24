import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Isotipo, Logo } from "@/components/brand/logo";
import { Auroras, Corazon, Hoja, Puntitos } from "@/components/brand/decoraciones";

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      {/* Panel de marca */}
      <aside className="relative hidden w-[46%] overflow-hidden fondo-degradado lg:flex lg:flex-col lg:justify-between lg:p-14">
        <Puntitos className="opacity-15" />
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-lila-200/25 blur-3xl" />
        <Hoja className="animate-flotar absolute top-1/4 right-16 h-24 w-24 text-white/15" />

        <Link href="/" className="relative">
          <Logo invertido />
        </Link>

        <div className="relative">
          <Isotipo className="animate-flotar h-28" invertido />
          <p className="mt-10 max-w-sm text-4xl leading-tight font-light text-white">
            No se trata de ser la mejor.
            <span className="mt-2 block font-normal">
              Se trata de ser tu mejor versión.
            </span>
          </p>
          <p className="font-script mt-6 text-2xl text-lila-200">
            Fuerza que te transforma <Corazon className="inline h-5 w-5 align-baseline" />
          </p>
        </div>

        <p className="letra-ancha relative text-[10px] text-lila-200/60 uppercase">
          Fuerza · Disciplina · Evolución
        </p>
      </aside>

      {/* Formulario */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-crema px-6 py-14">
        <Auroras className="opacity-60 lg:opacity-40" />

        <div className="relative w-full max-w-md">
          <Link
            href="/"
            className="mb-9 inline-flex items-center gap-2 text-xs font-light tracking-wide text-violeta-600 transition-colors hover:text-violeta-800"
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
