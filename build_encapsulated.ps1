# build_encapsulated.ps1
Write-Host "==============================================="
Write-Host "🔨 Iniciando el empaquetado seguro de RH..."
Write-Host "==============================================="

# 1. Construir la imagen Docker usando el Dockerfile
Write-Host "`n[1/3] Compilando código (TypeScript + React) y construyendo contenedor Docker..."
docker build -t app-rh-encapsulada:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen de Docker. Asegúrate de tener Docker abierto." -ForegroundColor Red
    exit 1
}

# 2. Exportar la imagen a un archivo .tar
Write-Host "`n[2/3] Exportando el sistema a instalador-rh.tar (Esto puede tardar unos minutos)..."
docker save -o instalador-rh.tar app-rh-encapsulada:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al exportar la imagen." -ForegroundColor Red
    exit 1
}

# 3. Empaquetar todo en un archivo ZIP para el cliente/servidor
Write-Host "`n[3/3] Comprimiendo archivos de despliegue en un ZIP..."
# Crear carpeta temporal
$deployFolder = "despliegue_produccion"
New-Item -ItemType Directory -Force -Path $deployFolder | Out-Null

# Copiar archivos esenciales
Copy-Item -Path "instalador-rh.tar" -Destination "$deployFolder\" -Force
Copy-Item -Path "docker-compose.prod.yml" -Destination "$deployFolder\docker-compose.yml" -Force
Copy-Item -Path "database" -Destination "$deployFolder\database" -Recurse -Force

# Crear ZIP
Compress-Archive -Path "$deployFolder\*" -DestinationPath "Entregable_Servidor_Pruebas.zip" -Force

# Limpieza
Remove-Item -Path $deployFolder -Recurse -Force
Remove-Item -Path "instalador-rh.tar" -Force

Write-Host "`n✅ ¡Listo! El sistema está encapsulado." -ForegroundColor Green
Write-Host "El archivo que debes entregar es: Entregable_Servidor_Pruebas.zip"
Write-Host "Dentro del ZIP el cliente encontrará:"
Write-Host "  - instalador-rh.tar (Tu código compilado, ilegible)"
Write-Host "  - docker-compose.yml (Para levantar todo)"
Write-Host "  - database/ (Los catalogos iniciales)"
