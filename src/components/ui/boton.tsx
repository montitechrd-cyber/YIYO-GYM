import Link from "next/link";
import { cn } from "@/lib/utils";

type Variante = "primario" | "suave" | "contorno" | "fantasma" | "claro";
type Tamano = "sm" | "md" | "lg";

const variantes: Record<Variante, string> = {
  primario:
    "fondo-degradado text-white shadow-suave hover:shadow-elevada hover:brightness-110",
  suave: "bg-lila-200 text-violeta-800 hover:bg-lila-300",
  contorno:
    "border border-lila-400 bg-white/60 text-violeta-700 hover:bg-lila-100 hover:border-violeta-500",
  fantasma: "text-violeta-700 hover:bg-lila-100",
  claro: "bg-white text-violeta-700 shadow-suave hover:bg-lila-50",
};

const tamanos: Record<Tamano, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-9 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violeta-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

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
