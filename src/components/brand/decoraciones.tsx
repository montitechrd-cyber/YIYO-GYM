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

/** Icono de WhatsApp: el canal por el que Yiyo atiende de verdad. */
export function IconoWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2h-.01C6.5 2 2.02 6.48 2.02 12c0 1.76.46 3.48 1.34 5L2 22l5.15-1.35A9.93 9.93 0 0 0 12.04 22C17.57 22 22.05 17.52 22.05 12S17.57 2 12.04 2Zm0 18.18c-1.6 0-3.17-.43-4.54-1.24l-.33-.19-3.05.8.81-2.98-.21-.34a8.14 8.14 0 0 1-1.25-4.35c0-4.51 3.67-8.18 8.18-8.18 2.19 0 4.24.85 5.78 2.4a8.11 8.11 0 0 1 2.4 5.79c0 4.51-3.67 8.29-8.18 8.29Z" />
    </svg>
  );
}
