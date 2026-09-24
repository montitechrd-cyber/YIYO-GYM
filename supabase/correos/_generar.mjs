/**
 * Genera las plantillas de correo de Supabase.
 *
 * Los tres correos comparten cabecera, botón y pie: escribirlos tres veces
 * en HTML de tabla —que es lo único que entienden Outlook y Gmail— termina
 * en tres maquetaciones que se parecen pero no son iguales. Aquí se escribe
 * una vez y cambia solo el texto.
 *
 * Para regenerarlos:  node supabase/correos/_generar.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));

const VIOLETA = "#6a2cab";
const VIOLETA_OSCURO = "#3f1a6b";
const LILA_CLARO = "#faf6ff";
const LILA_BORDE = "#e9d6ff";

// `{{ .SiteURL }}` y no la dirección escrita a mano: el día que se conecte
// el dominio propio, el logo y los enlaces lo siguen sin tocar nada aquí.
const LOGO = "{{ .SiteURL }}/logo-yiyo-gym-horizontal-blanco.png";

function plantilla({ asunto, titulo, cursiva, cuerpo, boton, enlace, pie }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${asunto}</title>
</head>
<body style="margin:0;padding:0;background-color:${LILA_CLARO};">
<!-- Vista previa de la bandeja: lo que se lee junto al asunto sin abrir. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${asunto} — YIYO GYM</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${LILA_CLARO};">
<tr><td align="center" style="padding:32px 16px;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid ${LILA_BORDE};">

  <tr><td align="center" style="background-color:${VIOLETA};padding:34px 24px;">
    <img src="${LOGO}" alt="YIYO GYM" width="180" style="display:block;width:180px;max-width:70%;height:auto;border:0;" />
  </td></tr>

  <tr><td style="padding:40px 36px 8px 36px;">
    <h1 style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:27px;line-height:1.25;font-weight:300;color:${VIOLETA_OSCURO};">
      ${titulo} <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;color:${VIOLETA};">${cursiva}</span>
    </h1>
    <p style="margin:18px 0 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#4a4458;">
      ${cuerpo}
    </p>
  </td></tr>

  <tr><td align="center" style="padding:30px 36px 8px 36px;">
    <!-- Tabla y no un <a> suelto: Outlook ignora el relleno de un enlace y
         el botón quedaría del alto del texto. -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center" bgcolor="${VIOLETA}" style="border-radius:999px;">
        <a href="${enlace}" style="display:inline-block;padding:16px 38px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:999px;">${boton}</a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:22px 36px 36px 36px;">
    <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8b8398;">
      ${pie}
    </p>
    <p style="margin:16px 0 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8b8398;">
      Si el botón no funciona, copia esta dirección en tu navegador:<br />
      <!-- Sin ella, quien use un lector que bloquea botones se queda sin salida. -->
      <a href="${enlace}" style="color:${VIOLETA};word-break:break-all;">${enlace}</a>
    </p>
  </td></tr>

</table>

<p style="margin:22px 0 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#a49cb0;text-align:center;">
  YIYO GYM · Entrenamiento y nutrición con Daniela «Yiyo» Chacón<br />Santo Domingo, República Dominicana
</p>

</td></tr>
</table>
</body>
</html>
`;
}

const correos = {
  // Cada plantilla apunta a `/auth/confirm` con `token_hash` en vez de usar
  // `{{ .ConfirmationURL }}`: ese enlace por defecto solo se canjea en el
  // navegador donde empezó todo, y el correo se abre en el móvil.
  "confirmar-cuenta.html": plantilla({
    asunto: "Confirma tu cuenta",
    titulo: "Ya casi estás",
    cursiva: "dentro",
    cuerpo:
      "Bienvenida a YIYO GYM. Solo falta confirmar que esta dirección es tuya y tu cuenta queda activa —entras directo, sin escribir la contraseña otra vez—.",
    boton: "Activar mi cuenta",
    enlace:
      "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup",
    pie: "El enlace vale una sola vez y caduca en 24 horas. Si no creaste ninguna cuenta, puedes ignorar este correo: sin este clic no se activa nada.",
  }),

  "recuperar-contrasena.html": plantilla({
    asunto: "Recupera tu contraseña",
    titulo: "Vamos a por una",
    cursiva: "nueva clave",
    cuerpo:
      "Pediste recuperar el acceso a tu cuenta de YIYO GYM. Pincha abajo y te llevamos directo a crear una contraseña nueva.",
    boton: "Crear contraseña nueva",
    enlace:
      "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery",
    pie: "El enlace vale una sola vez y caduca en 1 hora. Si no fuiste tú quien lo pidió, ignora este correo: tu contraseña actual sigue funcionando y nadie la ha visto.",
  }),

  "cambio-de-correo.html": plantilla({
    asunto: "Confirma tu correo nuevo",
    titulo: "Confirma tu",
    cursiva: "correo nuevo",
    cuerpo:
      "Pediste cambiar la dirección de tu cuenta a <strong style=\"color:#3f1a6b;\">{{ .NewEmail }}</strong>. Confírmalo desde aquí y a partir de ese momento entrarás con la nueva.",
    boton: "Confirmar el cambio",
    enlace:
      "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change",
    pie: "Si no pediste este cambio, ignora este correo y avísanos: tu dirección actual no cambia mientras no se pinche este enlace.",
  }),
};

for (const [nombre, html] of Object.entries(correos)) {
  writeFileSync(join(aqui, nombre), html, "utf8");
  console.log("escrito", nombre);
}
