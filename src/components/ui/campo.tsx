import { cn } from "@/lib/utils";

const baseControl =
  "w-full rounded-2xl border border-lila-300 bg-white/80 px-4 py-3 text-sm text-violeta-900 outline-none transition-all duration-300 placeholder:text-violeta-900/35 focus:border-violeta-500 focus:bg-white focus:ring-4 focus:ring-lila-200/60 disabled:opacity-60";

export function Entrada({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseControl, className)} {...props} />;
}

export function AreaTexto({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(baseControl, "min-h-28 resize-y", className)} {...props} />
  );
}

export function Seleccion({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseControl, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Etiqueta({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-2 block text-[11px] tracking-[0.16em] text-violeta-600 uppercase",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function Campo({
  etiqueta,
  htmlFor,
  ayuda,
  className,
  children,
}: {
  etiqueta: string;
  htmlFor?: string;
  ayuda?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Etiqueta htmlFor={htmlFor}>{etiqueta}</Etiqueta>
      {children}
      {ayuda && <p className="mt-2 text-xs font-light text-violeta-900/50">{ayuda}</p>}
    </div>
  );
}
