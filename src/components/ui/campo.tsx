import { cn } from "@/lib/utils";

const baseControl =
  "w-full rounded-sm border border-violeta-900/35 bg-white px-3.5 py-3 text-[15px] text-violeta-900 outline-none transition-colors duration-200 placeholder:text-violeta-900/45 hover:border-violeta-900 focus:border-violeta-700 focus:ring-2 focus:ring-violeta-700 disabled:opacity-60";

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
        "mb-2 block text-[11px] font-semibold tracking-[0.14em] text-violeta-800 uppercase",
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
      {ayuda && <p className="mt-2 text-xs text-violeta-900/65">{ayuda}</p>}
    </div>
  );
}
