# build_exe.ps1
Write-Host "==============================================="
Write-Host "[*] Iniciando el empaquetado en archivo Ejecutable (.exe)..."
Write-Host "==============================================="

# 1. Instalar dependencias si faltan (pkg)
Write-Host "`n[1/4] Instalando la herramienta de empaquetado (pkg)..."
npm install -g pkg

if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] Fallo al instalar pkg. Asegurate de tener Node.js instalado." -ForegroundColor Red
    exit 1
}

# 2. Compilar React y TypeScript
Write-Host "`n[2/4] Compilando codigo (TypeScript + React)..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] Fallo al compilar el codigo fuente." -ForegroundColor Red
    exit 1
}

# 3. Construir el ejecutable
Write-Host "`n[3/4] Empaquetando todo en un unico archivo ejecutable..."
pkg . --out-path ./paquete

if ($LASTEXITCODE -ne 0) {
    Write-Host "[Error] Fallo al generar el ejecutable." -ForegroundColor Red
    exit 1
}

# 4. Crear ZIP
Write-Host "`n[4/4] Comprimiendo archivos de despliegue en un ZIP..."
$deployFolder = "despliegue_windows"
New-Item -ItemType Directory -Force -Path $deployFolder | Out-Null

# Buscar el nombre exacto que generó pkg y copiarlo
$exePath = Get-ChildItem -Path "./paquete" -Filter "*.exe" | Select-Object -First 1
if ($exePath) {
    Copy-Item -Path $exePath.FullName -Destination "$deployFolder\sistema-rh.exe" -Force
}

# Copiar scripts de la BD y .env
Copy-Item -Path "database" -Destination "$deployFolder\database" -Recurse -Force
Copy-Item -Path ".env.example" -Destination "$deployFolder\.env" -Force

# Crear ZIP final
Compress-Archive -Path "$deployFolder\*" -DestinationPath "Entregable_Servidor_Windows.zip" -Force

# Limpieza
Remove-Item -Path $deployFolder -Recurse -Force
Remove-Item -Path "./paquete" -Recurse -Force

Write-Host "`n[EXITO] Listo! El sistema esta compilado y sellado." -ForegroundColor Green
Write-Host "El archivo que debes entregar es: Entregable_Servidor_Windows.zip"
Write-Host "Dentro del ZIP el cliente encontrara:"
Write-Host "  - sistema-rh.exe (Un solo archivo con TODO tu codigo oculto dentro)"
Write-Host "  - .env (Donde pondran las contrasenas de su base de datos)"
Write-Host "  - database/ (Los catalogos iniciales)"
