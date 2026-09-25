/**
 * La dirección pública de la plataforma, para construir redirecciones.
 *
 * `new URL(request.url)` no sirve detrás de un proxy. Railway atiende dentro
 * del contenedor en su propio puerto y pone el dominio público por delante,
 * así que en un route handler `request.url` llega como
 * `http://localhost:8080/...`. Redirigir contra ese origen mandaba a la
 * persona a su propio ordenador: el acceso con Google terminaba en
 * «localhost:8080/admin» y un ERR_CONNECTION_REFUSED.
 *
 * Se usa `NEXT_PUBLIC_SITE_URL` antes que la cabecera `x-forwarded-host`
 * aunque las dos sirvan: la cabecera la escribe quien llama, y un proxy mal
 * configurado dejaría que alguien de fuera la falsificara para que nuestras
 * propias redirecciones llevaran a su dominio. La variable no se puede
 * falsificar desde fuera.
 *
 * Al cambiar de dominio hay que actualizar esa variable —es la misma que ya
 * hay que tocar en Supabase y en Google—.
 */
export function origenPublico(peticion: Request): string {
  const configurado = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configurado) return configurado.replace(/\/+$/, "");

  const host = peticion.headers.get("x-forwarded-host");
  if (host) {
    const protocolo = peticion.headers.get("x-forwarded-proto") ?? "https";
    return `${protocolo}://${host}`;
  }

  return new URL(peticion.url).origin;
}
