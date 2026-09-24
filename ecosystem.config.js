/**
 * Configuración de PM2 para mantener YIYO GYM encendida en el VPS.
 *
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *
 * PM2 la reinicia sola si se cae y la vuelve a levantar si el servidor
 * se reinicia (siempre que hayas corrido `pm2 startup`).
 */
module.exports = {
  apps: [
    {
      name: "yiyo-gym",
      cwd: "/var/www/yiyo-gym",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/yiyo-gym/error.log",
      out_file: "/var/log/yiyo-gym/salida.log",
      time: true,
    },
  ],
};
