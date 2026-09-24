#!/usr/bin/env bash
# Actualiza YIYO GYM en el VPS tras subir cambios nuevos.
#   bash actualizar.sh
set -euo pipefail

cd /var/www/yiyo-gym

echo "==> Trayendo la última versión"
if [ -d .git ]; then
  git pull
fi

echo "==> Instalando dependencias"
npm ci --omit=dev --ignore-scripts || npm ci

echo "==> Compilando"
npm run build

echo "==> Reiniciando"
pm2 reload yiyo-gym

echo "==> Listo. Estado:"
pm2 status yiyo-gym
