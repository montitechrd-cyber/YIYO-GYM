/**
 * Aviso de «he empezado a reproducir»: lo escuchan todas las tarjetas de la
 * página para volver a su portada si la que arrancó no es ella.
 *
 * Vive aparte porque lo comparten los dos reproductores —el de video y el
 * de la demostración animada—: si cada uno usara su propio aviso, pulsar
 * una demostración dejaría un video sonando al lado.
 */
export const EVENTO_REPRODUCCION = "yiyo:video-reproduciendo";

export function avisarQueArranco(propio: string) {
  window.dispatchEvent(
    new CustomEvent(EVENTO_REPRODUCCION, { detail: propio })
  );
}

/**
 * La imagen fija que acompaña a una demostración animada.
 *
 * Se deduce del nombre del archivo en vez de guardarse en su propia
 * columna: las sube el mismo script que las genera, siempre en pareja y
 * en la misma carpeta. Si el archivo no es un `.webp` nuestro devuelve
 * null, y entonces la tarjeta lo enseña quieto sin botón de play.
 */
export function carteleraDe(url: string): string | null {
  return url.endsWith(".webp") ? url.replace(/\.webp$/, "-quieto.webp") : null;
}
