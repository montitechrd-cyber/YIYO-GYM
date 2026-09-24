import { cn } from "@/lib/utils";

type MarcaProps = {
  className?: string;
  /** Usa tonos claros para fondos oscuros */
  invertido?: boolean;
};

/**
 * Isotipo YIYO GYM: figura femenina con los brazos alzados formando una «Y»,
 * hoja germinando arriba y cuenco/swoosh inferior.
 */
export function Isotipo({ className, invertido = false }: MarcaProps) {
  const oscuro = invertido ? "#E9D6FF" : "#6A2CAB";
  const medio = invertido ? "#C7A6F7" : "#9170F5";
  const claro = invertido ? "#FFFFFF" : "#C7A6F7";

  return (
    <svg
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto w-auto", className)}
      aria-hidden="true"
    >
      {/* Cuenco inferior — abraza la figura */}
      <path
        d="M24 62c-6 26 6 48 36 48s42-22 36-48"
        stroke={claro}
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Brazo izquierdo, trazo grueso descendente */}
      <path
        d="M18 14c2 30 14 52 42 66"
        stroke={oscuro}
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Brazo derecho */}
      <path
        d="M96 26c-2 26-14 45-36 54"
        stroke={medio}
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Tallo central */}
      <path
        d="M60 78v26"
        stroke={oscuro}
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Hoja germinando */}
      <path
        d="M62 34c0-11 7-19 17-21 2 11-4 20-17 21Z"
        fill={medio}
      />
      <path
        d="M62 34c4-7 10-13 17-16"
        stroke={oscuro}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

type LogoProps = MarcaProps & {
  /** Oculta el texto y deja solo el isotipo */
  soloIcono?: boolean;
  tamano?: "sm" | "md" | "lg";
};

export function Logo({
  className,
  invertido = false,
  soloIcono = false,
  tamano = "md",
}: LogoProps) {
  const iconos = { sm: "h-8", md: "h-11", lg: "h-20" };
  const titulos = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl",
  };
  const subtitulos = { sm: "text-[7px]", md: "text-[9px]", lg: "text-sm" };

  if (soloIcono) {
    return <Isotipo className={cn(iconos[tamano], className)} invertido={invertido} />;
  }

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Isotipo className={iconos[tamano]} invertido={invertido} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-light letra-ancha",
            titulos[tamano],
            invertido ? "text-white" : "text-violeta-700"
          )}
        >
          YIYO
        </span>
        <span
          className={cn(
            "mt-1 flex items-center gap-1.5 font-light letra-ancha",
            subtitulos[tamano],
            invertido ? "text-lila-200" : "text-violeta-500"
          )}
        >
          <span className="h-px w-3 bg-current opacity-60" />
          GYM
          <span className="h-px w-3 bg-current opacity-60" />
        </span>
      </span>
    </span>
  );
}
