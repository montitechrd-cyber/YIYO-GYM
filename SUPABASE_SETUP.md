# Configurar Supabase para YIYO GYM

Sigue estos pasos (toma unos 10 minutos). Yo no puedo crear la cuenta por ti, pero te guío.

---

## 1. Crear cuenta y proyecto

1. Entra a **https://supabase.com** y haz clic en **Start your project**.
2. Regístrate (puedes usar tu cuenta de GitHub o tu correo).
3. Ya dentro, haz clic en **New project**.
4. Rellena:
   - **Name:** `yiyo-gym`
   - **Database Password:** genera una fuerte y **guárdala** en un lugar seguro.
   - **Region:** la más cercana a tus clientas. Para República Dominicana: `East US (North Virginia)`.
   - **Plan:** Free.
5. Haz clic en **Create new project** y espera ~2 minutos.

---

## 2. Copiar las credenciales

En el menú lateral: **Project Settings** (engranaje) → **API**.

| Qué copiar | Dónde está | Para qué sirve |
|---|---|---|
| **Project URL** | Sección "Project URL" | La dirección de tu base de datos |
| **anon public** key | "Project API keys" | Clave pública, va en el navegador |
| **service_role** key | "Project API keys" → clic en *Reveal* | Clave secreta de administrador |

> ⚠️ La **service_role** key es secreta. Nunca la compartas ni la subas a GitHub.
> Solo va en `.env.local`, que ya está excluido del control de versiones.

---

## 3. Pegarlas en el proyecto

Abre el archivo **`.env.local`** (está en la raíz de la carpeta del proyecto) y
rellena las tres primeras líneas:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

Guarda el archivo.

---

## 4. Cargar el esquema de la base de datos

En Supabase: **SQL Editor** (menú lateral) → **New query**.

### Si la base está vacía (instalación nueva)

Un solo archivo: `supabase/migrations/INSTALAR_TODO.sql`.
Ábrelo, copia todo, pégalo en el editor y **Run**. Debe decir *Success*.

Eso deja montado el esquema, la seguridad, la biblioteca de ejercicios, los
siete programas de entrenamiento y los cuatro planes de alimentación.

### Si ya tienes la base funcionando

Ejecuta `supabase/migrations/ACTUALIZAR.sql`. Contiene todo lo que vino
después de la instalación original:

- bloques de rutina (calentamiento, circuitos, descansos)
- el módulo de alimentación completo
- el catálogo prearmado: 7 programas y 4 planes de comida

Se puede ejecutar más de una vez sin duplicar nada.

> ⚠️ Sin este archivo la sección **Programas** aparece vacía y las dietas no
> se pueden guardar, porque sus tablas todavía no existen.

---

## 5. Ajustes de autenticación

**Authentication** → **Sign In / Providers** → **Email**:

- Durante el desarrollo, **desactiva "Confirm email"** para poder registrarte y
  entrar de inmediato. Cuando la plataforma salga a producción lo reactivamos.

**Authentication** → **URL Configuration**:

- **Site URL:** `http://localhost:3000` (cámbialo a tu dominio real al publicar)

---

## 6. Crear tu usuario administrador

1. Levanta la plataforma con `npm run dev` y entra a `http://localhost:3000/registro`.
2. Regístrate con tu correo.
3. Vuelve a Supabase → **Table Editor** → tabla **`perfiles`**.
4. Busca tu fila y cambia la columna **`rol`** de `cliente` a `admin`.
5. Cierra sesión y vuelve a entrar: ahora verás el panel de administración.

---

## ¿Algo falló?

- **"relation already exists"** al correr una migración: ya la habías ejecutado.
  Puedes continuar con la siguiente.
- **No puedo entrar después de registrarme:** revisa que desactivaste
  *Confirm email* en el paso 5.
- **La app dice que faltan credenciales:** revisa que `.env.local` tenga los
  valores correctos y **reinicia** `npm run dev`.
