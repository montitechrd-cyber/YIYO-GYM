# Espera a que el servidor de YIYO GYM responda y abre el navegador.
# Lo lanza "Iniciar YIYO GYM.cmd"; no hace falta ejecutarlo a mano.

for ($i = 0; $i -lt 90; $i++) {
  try {
    $null = Invoke-WebRequest 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2
    Start-Process 'http://localhost:3000'
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}
