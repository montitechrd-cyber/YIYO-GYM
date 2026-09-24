/**
 * Logotipos de los proveedores de acceso social.
 *
 * Van aquí como SVG y no desde `lucide-react` porque esa librería no incluye
 * marcas. Cada uno respeta sus colores oficiales: son marcas registradas y
 * sus normas de uso no permiten recolorearlos.
 */

export function IconoGoogle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.11 0 5.72-1.03 7.62-2.8l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.75H1.7v2.98A11.5 11.5 0 0 0 12 23.5z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.16a6.9 6.9 0 0 1 0-4.32V6.86H1.7a11.5 11.5 0 0 0 0 10.28l3.85-2.98z"
      />
      <path
        fill="#EA4335"
        d="M12 5.09c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.63 15.11.5 12 .5A11.5 11.5 0 0 0 1.7 6.86l3.85 2.98C6.46 7.12 9 5.09 12 5.09z"
      />
    </svg>
  );
}

export function IconoFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}

export function IconoApple({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M17.05 12.74c-.03-2.75 2.25-4.07 2.35-4.14-1.28-1.87-3.27-2.13-3.98-2.16-1.7-.17-3.31 1-4.17 1-.85 0-2.18-.98-3.58-.95-1.85.03-3.55 1.07-4.5 2.72-1.92 3.33-.49 8.26 1.38 10.96.91 1.32 2 2.8 3.43 2.75 1.37-.06 1.89-.89 3.55-.89 1.66 0 2.13.89 3.58.86 1.48-.03 2.42-1.35 3.33-2.68 1.05-1.54 1.48-3.03 1.5-3.11-.03-.01-2.88-1.1-2.91-4.36zM14.3 4.6c.75-.92 1.26-2.19 1.12-3.46-1.08.04-2.4.72-3.18 1.63-.7.81-1.31 2.11-1.15 3.35 1.21.09 2.45-.61 3.21-1.52z"
      />
    </svg>
  );
}
