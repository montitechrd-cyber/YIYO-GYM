import Link from "next/link";
import { cn } from "@/lib/utils";

type Variante = "primario" | "suave" | "contorno" | "fantasma" | "claro";
type Tamano = "sm" | "md" | "lg";

const variantes: Record<Variante, string> = {
  primario:
    "bg-violeta-700 text-white border border-violeta-700 hover:bg-violeta-900 hover:border-violeta-900",
  suave: "bg-lila-200 text-violeta-900 border border-lila-200 hover:bg-lila-300 hover:border-lila-300",
  contorno:
    "border border-violeta-900 bg-transparent text-violeta-900 hover:bg-violeta-900 hover:text-white",
  fantasma: "text-violeta-800 hover:bg-lila-100 border border-transparent",
  claro: "bg-crema text-violeta-900 border border-crema hover:bg-lila-200 hover:border-lila-200",
};

const tamanos: Record<Tamano, string> = {
  sm: "min-h-9 px-4 py-1.5 text-[11px]",
  md: "min-h-11 px-4 py-2 text-xs sm:px-6",
  lg: "min-h-14 px-6 py-3 text-sm sm:px-9",
};

const base =
  "inline-flex max-w-full items-center justify-center gap-2 rounded-sm text-center leading-tight font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violeta-700 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
};

export function Boton({
  className,
  variante = "primario",
  tamano = "md",
  ...props
}: Props) {
  return (
    <button
      className={cn(base, variantes[variante], tamanos[tamano], className)}
      {...props}
    />
  );
}

type EnlaceProps = React.ComponentProps<typeof Link> & {
  variante?: Variante;
  tamano?: Tamano;
};

export function BotonEnlace({
  className,
  variante = "primario",
  tamano = "md",
  ...props
}: EnlaceProps) {
  return (
    <Link
      className={cn(base, variantes[variante], tamanos[tamano], className)}
      {...props}
    />
  );
}
