import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tono = "error" | "exito" | "info";

const tonos: Record<Tono, { caja: string; icono: React.ElementType }> = {
  error: {
    caja: "border-rose-200 bg-rose-50 text-rose-800",
    icono: AlertCircle,
  },
  exito: {
    caja: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icono: CheckCircle2,
  },
  info: {
    caja: "border-lila-300 bg-lila-100 text-violeta-800",
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
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-light",
        caja,
        className
      )}
      role={tono === "error" ? "alert" : "status"}
    >
      <Icono size={17} className="mt-0.5 shrink-0" strokeWidth={1.8} />
      <span>{children}</span>
    </div>
  );
}
