import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tono = "error" | "exito" | "info";

const tonos: Record<Tono, { caja: string; icono: React.ElementType }> = {
  error: {
    caja: "border-rose-700 bg-rose-50 text-rose-900",
    icono: AlertCircle,
  },
  exito: {
    caja: "border-emerald-700 bg-emerald-50 text-emerald-900",
    icono: CheckCircle2,
  },
  info: {
    caja: "border-violeta-700 bg-lila-100 text-violeta-900",
    icono: Info,
  },
};

export function Aviso({
  tono = "info",
  children,
  className,
}: {
  tono?: Tono;
  children: React.ReactNode;
  className?: string;
}) {
  const { caja, icono: Icono } = tonos[tono];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-sm border px-3 py-3 sm:px-4 text-sm font-medium",
        caja,
        className
      )}
      role={tono === "error" ? "alert" : "status"}
    >
      <Icono size={17} className="mt-0.5 shrink-0" strokeWidth={1.8} />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}
