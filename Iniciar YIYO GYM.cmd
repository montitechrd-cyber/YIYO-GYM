@echo off
title YIYO GYM
cd /d "%~dp0"

echo.
echo   ============================================
echo      Y I Y O   G Y M
echo      Fuerza que te transforma
echo   ============================================
echo.

if not exist "node_modules" (
  echo   Primera vez: instalando dependencias...
  echo   Esto tarda unos minutos, solo pasa una vez.
  echo.
  call npm install
  echo.
)

echo   Encendiendo la plataforma...
echo   El navegador se abrira solo en unos segundos.
echo.
echo   Para APAGARLA: cierra esta ventana o pulsa Ctrl + C
echo.

rem Espera a que el servidor responda y recien ahi abre el navegador
start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0abrir-navegador.ps1"

call npm run dev

echo.
echo   La plataforma se detuvo.
pause
