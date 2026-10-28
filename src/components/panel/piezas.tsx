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
        "mb-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-violeta-900 pb-4 sm:mb-10 sm:pb-5",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[clamp(2.25rem,9vw,3rem)] leading-none break-words text-violeta-900 md:text-6xl">{titulo}</h1>
        {descripcion && (
          <p className="mt-3 max-w-prose text-sm break-words text-violeta-900/70">{descripcion}</p>
        )}
      </div>
      {acciones && <div className="flex min-w-0 flex-wrap gap-2 sm:gap-3">{acciones}</div>}
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
        "rounded-sm border border-violeta-900/20 border-t-[3px] border-t-violeta-900 bg-white p-4 sm:p-6 md:p-7",
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
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:mb-6">
      <h2 className="min-w-0 text-xl break-words text-violeta-900">
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
        "min-w-0 rounded-sm border p-4 transition-colors sm:p-5 duration-200",
        destacada
          ? "border-violeta-700 bg-violeta-700 text-white"
          : "border-violeta-900/20 bg-white text-violeta-900 hover:border-violeta-900"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 break-words text-[11px] font-semibold tracking-[0.14em] uppercase",
            destacada ? "text-lila-200" : "text-violeta-700"
          )}
        >
          {etiqueta}
        </p>
        {Icono && (
          <span className={cn("shrink-0", destacada ? "text-lila-200" : "text-violeta-500")}>
            <Icono size={18} strokeWidth={1.6} />
          </span>
        )}
      </div>
      <p className="cifra mt-4 text-5xl break-words sm:mt-5 sm:text-6xl">{valor}</p>
      {detalle && (
        <p
          className={cn(
            "mt-2 text-xs break-words",
            destacada ? "text-lila-100" : "text-violeta-900/65"
          )}
        >
          {detalle}
        </p>
      )}
    </div>
  );
}

const TONOS_INSIGNIA = {
  lila: "bg-lila-200 text-violeta-900",
  violeta: "bg-violeta-700 text-white",
  verde: "bg-emerald-100 text-emerald-900",
  ambar: "bg-amber-100 text-amber-900",
  rosa: "bg-rose-100 text-rose-900",
  gris: "border border-violeta-900/20 text-violeta-900/65",
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
        "inline-flex max-w-full items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10px] leading-tight font-bold tracking-[0.12em] uppercase",
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
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-violeta-900/40 bg-lila-50 px-4 py-10 text-center sm:px-8 sm:py-16">
      {Icono && (
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm bg-violeta-700 text-white">
          <Icono size={24} strokeWidth={1.4} />
        </span>
      )}
      <p className="font-display text-2xl font-extrabold uppercase break-words text-violeta-900 [font-stretch:72%] sm:text-3xl">{titulo}</p>
      {descripcion && (
        <p className="mt-2 max-w-sm text-sm text-violeta-900/70">
          {descripcion}
        </p>
      )}
      {accion && <div className="mt-7">{accion}</div>}
    </div>
  );
}
