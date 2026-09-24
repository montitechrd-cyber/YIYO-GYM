# Publicar YIYO GYM en tu VPS de Hostinger

Guía completa. Copia y pega los comandos tal cual, cambiando solo tu dominio
y tu usuario. Tiempo estimado: 45 minutos la primera vez.

Sustituye en todo el documento:
- `tudominio.com` → tu dominio real
- `TU_IP` → la IP de tu VPS (la ves en hPanel → VPS → Panel general)

---

## Antes de empezar

Necesitas:
- La **IP** de tu VPS y la **contraseña de root** (hPanel → VPS → Acceso SSH).
- Tu **dominio apuntando a esa IP**. En hPanel → Dominios → DNS, crea o edita:

  | Tipo | Nombre | Apunta a |
  |---|---|---|
  | A | `@` | `TU_IP` |
  | A | `www` | `TU_IP` |

  Los DNS tardan entre 10 minutos y 2 horas en propagarse. Haz esto primero
  y sigue con el resto mientras tanto.

Si el VPS es nuevo, elige una plantilla **Ubuntu 24.04** limpia (sin panel).

---

## 1. Entrar al servidor

Desde tu PC, abre PowerShell:

```bash
ssh root@TU_IP
```

La primera vez pregunta si confías en el servidor: escribe `yes`. Luego pega
la contraseña (al escribirla no se ve nada, es normal).

---

## 2. Preparar el servidor

```bash
apt update && apt upgrade -y
apt install -y curl git nginx ufw
```

### Node.js 22

La plataforma necesita **Node.js 20.9 o superior**. Instalamos la 22 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
```

Debe responder `v22.x.x`.

### Memoria de intercambio

Compilar Next.js consume bastante RAM. Si tu VPS tiene 1 o 2 GB, esto evita
que la compilación se caiga a mitad:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

### Cortafuegos

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

> El puerto 3000 **no se abre**: la plataforma solo escucha por dentro y Nginx
> es quien atiende internet. Es más seguro así.

---

## 3. Subir el proyecto

### Opción A — con Git (recomendada)

Si tienes el proyecto en GitHub:

```bash
mkdir -p /var/www
git clone https://github.com/TU_USUARIO/TU_REPO.git /var/www/yiyo-gym
```

### Opción B — sin Git, arrastrando archivos

1. Descarga **WinSCP** en tu PC (winscp.net).
2. Conéctate con: protocolo `SFTP`, servidor `TU_IP`, usuario `root`, tu contraseña.
3. En el servidor entra a `/var/www/` y crea la carpeta `yiyo-gym`.
4. Desde tu PC arrastra **todo el contenido** de `C:\Users\OK\Desktop\CLAUDE\YIYO GYM`
   **excepto** estas tres carpetas, que no se suben nunca:
   - `node_modules`
   - `.next`
   - `.git`

---

## 4. Configurar las credenciales

```bash
cd /var/www/yiyo-gym
nano .env.local
```

Pega esto con **tus** valores reales:

```
NEXT_PUBLIC_SUPABASE_URL=https://qdzffyldkofxgrhukumo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_ENTORNO=live

NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

Guardar en nano: `Ctrl + O`, `Enter`, `Ctrl + X`.

> ⚠️ `NEXT_PUBLIC_SITE_URL` **debe** ser tu dominio con `https://`. Si lo dejas
> en `localhost`, los correos de recuperar contraseña enviarán a tus clientas
> a una página que no existe.

Protege el archivo para que solo root pueda leerlo:

```bash
chmod 600 .env.local
```

---

## 5. Compilar y encender

```bash
cd /var/www/yiyo-gym
npm ci
npm run build
```

La compilación tarda 1-3 minutos. Debe terminar con `✓ Compiled successfully`.

Ahora PM2, que mantiene la plataforma encendida:

```bash
npm install -g pm2
mkdir -p /var/log/yiyo-gym
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

El último comando imprime **otro comando**: cópialo, pégalo y ejecútalo. Eso
hace que la plataforma vuelva sola si el servidor se reinicia.

Comprueba que responde:

```bash
curl -I http://localhost:3000
```

Debe decir `HTTP/1.1 200 OK`.

---

## 6. Conectar tu dominio con Nginx

```bash
nano /etc/nginx/sites-available/yiyo-gym
```

Pega esto (cambia el dominio):

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Permite subir videos de ejercicios de hasta 50 MB
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

Actívalo:

```bash
ln -s /etc/nginx/sites-available/yiyo-gym /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Entra a `http://tudominio.com` — ya deberías ver la plataforma.

---

## 7. Certificado SSL (el candado)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tudominio.com -d www.tudominio.com
```

Te pedirá tu correo, aceptar los términos, y si quieres redirigir todo a HTTPS:
responde que **sí** (opción 2). El certificado se renueva solo.

Comprueba `https://tudominio.com`.

---

## 8. Ajustes finales (importantes)

### En Supabase

**Authentication → URL Configuration:**
- **Site URL:** `https://tudominio.com`
- **Redirect URLs:** añade `https://tudominio.com/**`

**Authentication → Sign In / Providers → Email:**
- **Reactiva "Confirm email"**. Lo desactivamos para las pruebas; en producción
  debe estar encendido para que nadie se registre con un correo ajeno.

### En PayPal

1. En developer.paypal.com cambia de **Sandbox** a **Live** y crea las
   credenciales reales. Ponlas en `.env.local` con `PAYPAL_ENTORNO=live`.
2. Crea los planes de suscripción y copia cada `plan_id` en
   **Admin → Planes y pagos** de tu plataforma.
3. Crea el webhook apuntando a:
   ```
   https://tudominio.com/api/paypal/webhook
   ```
   Suscríbelo a los eventos `BILLING.SUBSCRIPTION.*` y `PAYMENT.SALE.COMPLETED`,
   y copia el **Webhook ID** a `PAYPAL_WEBHOOK_ID`.

Tras cambiar `.env.local` hay que reiniciar:

```bash
cd /var/www/yiyo-gym && pm2 restart yiyo-gym
```

### Tu contraseña

Entra a `https://tudominio.com/entrar` con tu cuenta de administradora y
**cambia la contraseña** desde *Mi perfil*. La que tienes ahora fue generada
durante el desarrollo.

---

## Uso diario

| Qué quieres | Comando |
|---|---|
| Ver si está encendida | `pm2 status` |
| Ver los errores | `pm2 logs yiyo-gym --err` |
| Reiniciar | `pm2 restart yiyo-gym` |
| Publicar cambios nuevos | `cd /var/www/yiyo-gym && bash actualizar.sh` |

---

## Si algo falla

**La web no carga (502 Bad Gateway)**
La plataforma está apagada. `pm2 status` y luego `pm2 restart yiyo-gym`.
Si sigue, mira el error con `pm2 logs yiyo-gym --err --lines 50`.

**"Killed" durante `npm run build`**
Se quedó sin memoria. Revisa que creaste el swap del paso 2 (`free -h`).

**Entro pero me devuelve al login todo el rato**
`NEXT_PUBLIC_SITE_URL` no coincide con tu dominio real, o falta el Site URL
en Supabase. Revisa el paso 8 y reinicia con `pm2 restart yiyo-gym`.

**Los videos grandes no suben**
Falta `client_max_body_size 50M;` en Nginx. Revisa el paso 6.
