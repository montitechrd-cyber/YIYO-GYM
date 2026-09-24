# YIYO GYM

Plataforma web de coaching fitness y nutrición de Daniela «Yiyo» Chacón.

**Fuerza que te transforma** ♡

---

## Puesta en marcha

```bash
npm install
```

Después configura Supabase siguiendo **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** y arranca:

```bash
npm run dev
```

Abre `http://localhost:3000`.

---

## Módulos

| # | Módulo | Dónde vive |
|---|---|---|
| 1 | Autenticación y roles | `src/app/(auth)/`, `src/middleware.ts` |
| 2 | CRM de clientes | `src/app/entrenador/clientes/` |
| 3 | Perfil y evaluación inicial | `src/app/panel/bienvenida/`, `src/components/panel/formulario-evaluacion.tsx` |
| 4 | Biblioteca de ejercicios | `src/app/entrenador/ejercicios/` |
| 5 | Constructor de rutinas | `src/app/entrenador/rutinas/` |
| 6 | Programación / calendario | `src/app/entrenador/calendario/`, `src/app/panel/calendario/` |
| 7 | Registro del entrenamiento | `src/app/panel/entrenamientos/` |
| 8 | Seguimiento de progreso | `src/app/panel/progreso/` |
| 9 | Chat entrenadora-clienta | `src/app/panel/chat/`, `src/app/entrenador/chat/` |
| 10 | Notificaciones | `src/components/panel/notificaciones.tsx` |
| 11 | Suscripciones y pagos | `src/app/panel/suscripcion/`, `src/app/api/paypal/webhook/` |
| 12 | Dashboard entrenadora | `src/app/entrenador/page.tsx` |
| 13 | Dashboard clienta | `src/app/panel/page.tsx` |
| 14 | Panel administrador | `src/app/admin/` |
| 15 | Analytics | `src/app/admin/analytics/` |

---

## Roles

| Rol | Ruta base | Puede |
|---|---|---|
| `cliente` | `/panel` | Ver su rutina, registrar entrenamientos y progreso, chatear, gestionar su suscripción |
| `entrenador` | `/entrenador` | Todo lo anterior más CRM, ejercicios, rutinas, calendario y mensajes de sus clientas |
| `admin` | `/admin` | Todo, más gestión de usuarios, planes de precio y analytics |

Los roles se cambian desde **Admin → Usuarios**. La seguridad se aplica en tres capas:

1. `src/middleware.ts` protege las rutas según el rol.
2. Las políticas RLS de Postgres filtran **qué filas** ve cada quien.
3. Unos disparadores protegen **columnas concretas** que RLS no alcanza: el rol
   de una cuenta, la entrenadora asignada a una clienta y el texto de un mensaje
   ajeno. RLS trabaja por fila, no por columna, y sin esa tercera capa cualquiera
   podría editar su propio rol dentro de su propia fila.

### Estado verificado

Última auditoría: 57/57 rutas con el comportamiento esperado en los tres roles,
25 comprobaciones de aislamiento de datos, `tsc` y `eslint` sin avisos y
compilación de producción correcta.

---

## Identidad de marca

Definida en `src/app/globals.css` y usada en toda la app.

| Token | Valor | Uso |
|---|---|---|
| `lila-200` | `#E9D6FF` | Fondos suaves, bordes |
| `lila-400` | `#C7A6F7` | Acentos secundarios |
| `violeta-500` | `#9170F5` | Color primario |
| `violeta-700` | `#6A2CAB` | Titulares, CTAs |
| `crema` | `#FFFDFA` | Fondo general |

Tipografías: **Poppins** (texto) y **Dancing Script** (acentos femeninos).
El isotipo está recreado en SVG en `src/components/brand/logo.tsx`, así que escala sin pérdida.

---

## Configurar los pagos con PayPal

1. Entra a **https://developer.paypal.com** → *Apps & Credentials*.
2. Crea una app y copia el **Client ID** y el **Secret** a `.env.local`.
3. Crea un **producto** y un **plan de suscripción** por cada plan de precio
   (*Pay & Get Paid → Subscriptions → Plans*).
4. Copia cada `plan_id` de PayPal y pégalo en **Admin → Planes y pagos** → editar plan
   → campo *ID del plan en PayPal*.
5. Configura el webhook apuntando a `https://TU-DOMINIO/api/paypal/webhook` y suscríbelo
   a los eventos `BILLING.SUBSCRIPTION.*` y `PAYMENT.SALE.COMPLETED`. Copia el
   **Webhook ID** a `PAYPAL_WEBHOOK_ID`.

Mientras `PAYPAL_ENTORNO=sandbox` los cobros son de prueba. Cámbialo a `live` para
cobrar de verdad.

---

## Despliegue

Guía completa paso a paso: **[DESPLIEGUE_HOSTINGER.md](DESPLIEGUE_HOSTINGER.md)**

Resumen: la plataforma renderiza en servidor, así que necesita **Node.js 20.9+**
corriendo de forma permanente. Eso exige un **VPS** — el hosting web compartido
de Hostinger es solo PHP y no puede ejecutarla.

Archivos de apoyo incluidos:

| Archivo | Para qué |
|---|---|
| `DESPLIEGUE_HOSTINGER.md` | Guía completa con los comandos exactos |
| `ecosystem.config.js` | Configuración de PM2 para mantenerla encendida |
| `actualizar.sh` | Publicar cambios nuevos en el servidor |

---

## Comandos

```bash
npm run dev     # desarrollo
npm run build   # compilación de producción
npm start       # servir la compilación
npm run lint    # revisar el código
```
