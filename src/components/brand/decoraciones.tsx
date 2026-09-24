import { cn } from "@/lib/utils";

/** Hoja decorativa del isotipo, usada como ornamento flotante. */
export function Hoja({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
      aria-hidden="true"
    >
      <path
        d="M8 52C8 26 24 8 52 6c2 28-16 46-44 46Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M8 52C16 36 30 20 50 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Corazón fino del branding (el ♡ del tagline). */
export function Corazon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <path
        d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Glifo de Instagram (lucide v1 ya no incluye iconos de marca). */
export function IconoInstagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** Manchas de luz lila que dan el aire «aesthetic» al fondo. */
export function Auroras({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="animate-brillo absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-lila-300/50 blur-[110px]" />
      <div className="animate-brillo absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-violeta-500/25 blur-[120px] [animation-delay:1.5s]" />
      <div className="animate-brillo absolute -bottom-48 left-1/4 h-[28rem] w-[28rem] rounded-full bg-rosa/25 blur-[120px] [animation-delay:3s]" />
    </div>
  );
}

/** Retícula fina de puntos, textura sutil de fondo. */
export function Puntitos({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.35]",
        className
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(145,112,245,0.35) 1px, transparent 0)",
        backgroundSize: "26px 26px",
      }}
      aria-hidden="true"
    />
  );
}

/** Separador con la hoja al centro. */
export function Separador({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-lila-400" />
      <Hoja className="h-5 w-5 text-lila-400" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-lila-400" />
    </div>
  );
}
