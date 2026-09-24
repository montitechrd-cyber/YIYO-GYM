/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

type MarcaProps = {
  className?: string;
  /** Versión en blanco, para fondos oscuros */
  invertido?: boolean;
};

/**
 * Marca YIYO GYM.
 *
 * Las piezas salen todas del mismo archivo original —la marca vertical que
 * entregó Yiyo— recortada en tres presentaciones, porque una sola no sirve
 * en todos los sitios:
 *
 * - `Isotipo`: solo el símbolo, para cuando no hay espacio para el nombre.
 * - `Logo` horizontal: símbolo y nombre en línea. Es la que va en las barras
 *   de navegación, que son bajas y anchas; la vertical dejaría el texto a
 *   cinco píxeles de alto, ilegible.
 * - `Logo` vertical: la composición original, para donde sí hay altura.
 *
 * De cada una hay un negativo en blanco: sobre los fondos violeta de la
 * plataforma el magenta de la marca queda turbio y se lee mal.
 *
 * Se usa `<img>` y no `next/image` a propósito: son PNG con transparencia de
 * pocos KB que aparecen en todas las páginas, y el optimizador no aporta
 * nada mientras añade una petición más al servidor.
 */

const ARCHIVOS = {
  isotipo: {
    color: "/isotipo-yiyo-gym.png",
    blanco: "/isotipo-yiyo-gym-blanco.png",
    proporcion: 606 / 512,
  },
  horizontal: {
    color: "/logo-yiyo-gym-horizontal.png",
    blanco: "/logo-yiyo-gym-horizontal-blanco.png",
    proporcion: 825 / 200,
  },
  vertical: {
    color: "/logo-yiyo-gym.png",
    blanco: "/logo-yiyo-gym-blanco.png",
    proporcion: 597 / 512,
  },
} as const;

export function Isotipo({ className, invertido = false }: MarcaProps) {
  const { color, blanco } = ARCHIVOS.isotipo;
  return (
    <img
      src={invertido ? blanco : color}
      alt=""
      aria-hidden="true"
      className={cn("h-11 w-auto object-contain", className)}
    />
  );
}

type LogoProps = MarcaProps & {
  /** Oculta el nombre y deja solo el símbolo */
  soloIcono?: boolean;
  /** `vertical` apila símbolo y nombre: solo donde sobre altura */
  orientacion?: "horizontal" | "vertical";
  tamano?: "sm" | "md" | "lg";
};

export function Logo({
  className,
  invertido = false,
  soloIcono = false,
  orientacion = "horizontal",
  tamano = "md",
}: LogoProps) {
  // Alturas pensadas para que el nombre siempre se lea: la versión apilada
  // necesita bastante más que la de una línea para el mismo tamaño de letra.
  const alturas = {
    horizontal: { sm: "h-8", md: "h-11", lg: "h-16" },
    vertical: { sm: "h-14", md: "h-20", lg: "h-32" },
  };

  if (soloIcono) {
    const soloIconoAltura = { sm: "h-8", md: "h-11", lg: "h-20" };
    return (
      <Isotipo
        className={cn(soloIconoAltura[tamano], className)}
        invertido={invertido}
      />
    );
  }

  const pieza = ARCHIVOS[orientacion];

  return (
    <img
      src={invertido ? pieza.blanco : pieza.color}
      alt="YIYO GYM"
      className={cn(
        "w-auto object-contain",
        alturas[orientacion][tamano],
        className
      )}
    />
  );
}
