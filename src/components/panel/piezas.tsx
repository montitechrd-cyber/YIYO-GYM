import { cn } from "@/lib/utils";

export function Encabezado({
  titulo,
  descripcion,
  acciones,
  className,
}: {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-4",
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-light text-violeta-900">{titulo}</h1>
        {descripcion && (
          <p className="mt-2 text-sm font-light text-violeta-900/60">{descripcion}</p>
        )}
      </div>
      {acciones && <div className="flex flex-wrap gap-3">{acciones}</div>}
    </div>
  );
}

export function Tarjeta({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-4xl border border-lila-200 bg-white p-7 shadow-suave",
        className
      )}
    >
      {children}
    </section>
  );
}

export function TituloTarjeta({
  children,
  extra,
}: {
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 className="text-[11px] tracking-[0.22em] text-violeta-500 uppercase">
        {children}
      </h2>
      {extra}
    </div>
  );
}

export function Metrica({
  etiqueta,
  valor,
  detalle,
  icono: Icono,
  destacada = false,
}: {
  etiqueta: string;
  valor: React.ReactNode;
  detalle?: string;
  icono?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  destacada?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-4xl border p-6 transition-all duration-500",
        destacada
          ? "fondo-degradado border-transparent text-white shadow-suave"
          : "border-lila-200 bg-white text-violeta-900 hover:border-lila-400 hover:shadow-suave"
      )}
    >
      <div className="flex items-start justify-between">
        <p
          className={cn(
            "text-[10px] tracking-[0.2em] uppercase",
            destacada ? "text-lila-100" : "text-violeta-500"
          )}
        >
          {etiqueta}
        </p>
        {Icono && (
          <span className={destacada ? "text-lila-100" : "text-lila-400"}>
            <Icono size={18} strokeWidth={1.6} />
          </span>
        )}
      </div>
      <p className="mt-4 text-4xl font-light">{valor}</p>
      {detalle && (
        <p
          className={cn(
            "mt-2 text-xs font-light",
            destacada ? "text-lila-100/80" : "text-violeta-900/50"
          )}
        >
          {detalle}
        </p>
      )}
    </div>
  );
}

const TONOS_INSIGNIA = {
  lila: "bg-lila-100 text-violeta-700",
  violeta: "bg-violeta-500 text-white",
  verde: "bg-emerald-50 text-emerald-700",
  ambar: "bg-amber-50 text-amber-700",
  rosa: "bg-rose-50 text-rose-700",
  gris: "bg-lila-50 text-violeta-900/50",
} as const;

export function Insignia({
  children,
  tono = "lila",
  className,
}: {
  children: React.ReactNode;
  tono?: keyof typeof TONOS_INSIGNIA;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide",
        TONOS_INSIGNIA[tono],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Vacio({
  titulo,
  descripcion,
  accion,
  icono: Icono,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  icono?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-lila-300 bg-lila-50/60 px-8 py-16 text-center">
      {Icono && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-lila-100 text-violeta-500">
          <Icono size={24} strokeWidth={1.4} />
        </span>
      )}
      <p className="text-lg font-light text-violeta-800">{titulo}</p>
      {descripcion && (
        <p className="mt-2 max-w-sm text-sm font-light text-violeta-900/55">
          {descripcion}
        </p>
      )}
      {accion && <div className="mt-7">{accion}</div>}
    </div>
  );
}
