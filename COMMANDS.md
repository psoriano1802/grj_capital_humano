# 🛠️ Comandos Útiles y Troubleshooting - Sistema RH

## 📋 Comandos Principales

### Instalación y Configuración
```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Migrar base de datos
npm run db:migrate

# Insertar datos de prueba
psql -U postgres -d rh_management -f database/seed.sql
```

### Desarrollo
```bash
# Iniciar todo (backend + frontend)
npm run dev

# Solo backend (puerto 3000)
npm run server:dev

# Solo frontend (puerto 5173)
npm run client:dev
```

### Producción
```bash
# Compilar para producción
npm run build

# Iniciar en producción
npm start
```

### Base de Datos
```bash
# Conectarse a PostgreSQL
psql -U postgres -d rh_management

# Ejecutar schema
psql -U postgres -d rh_management -f database/schema.sql

# Ejecutar seed data
psql -U postgres -d rh_management -f database/seed.sql

# Backup de la base de datos
pg_dump -U postgres rh_management > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres rh_management < backup_20240101.sql
```

## 🔍 Verificación del Sistema

### 1. Verificar Instalación
```bash
# Verificar Node.js
node --version
# Debe ser >= 18.0.0

# Verificar npm
npm --version

# Verificar PostgreSQL
psql --version
# Debe ser >= 12.0

# Verificar dependencias instaladas
npm list --depth=0
```

### 2. Verificar Conexión a Base de Datos
```bash
# Desde psql
psql -U postgres -d rh_management -c "SELECT NOW();"

# Desde la aplicación
curl http://localhost:3000/health
```

### 3. Verificar Tablas Creadas
```sql
-- Conectarse a la base de datos
psql -U postgres -d rh_management

-- Listar todas las tablas
\dt

-- Debería mostrar:
-- empleados, biometricos, asistencias, permisos, 
-- vacaciones, incapacidades, usuarios, catalogos, configuracion
```

### 4. Verificar Datos de Prueba
```sql
-- Ver empleados
SELECT numero_empleado, nombre, apellido_paterno, departamento FROM empleados;

-- Ver catálogos
SELECT categoria, clave, valor FROM catalogos ORDER BY categoria, orden;

-- Ver configuración
SELECT clave, valor FROM configuracion;
```

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module"
```bash
# Problema: Dependencias no instaladas
# Solución:
npm install

# Si persiste:
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3000 is already in use"
```bash
# Problema: Puerto ocupado
# Solución 1: Cambiar puerto en .env
PORT=3001

# Solución 2: Matar proceso en Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Solución 3: Matar proceso en Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error: "Port 5173 is already in use"
```bash
# Problema: Puerto de Vite ocupado
# Solución: Editar vite.config.ts
server: {
  port: 5174
}
```

### Error: "password authentication failed for user postgres"
```bash
# Problema: Contraseña incorrecta
# Solución: Verificar .env
DB_PASSWORD=tu_password_correcta

# Resetear contraseña de PostgreSQL (Windows)
# 1. Editar pg_hba.conf
# 2. Cambiar "md5" a "trust"
# 3. Reiniciar servicio PostgreSQL
# 4. Cambiar contraseña:
psql -U postgres
ALTER USER postgres WITH PASSWORD 'nueva_password';
# 5. Revertir pg_hba.conf a "md5"
```

### Error: "database does not exist"
```bash
# Problema: Base de datos no creada
# Solución:
psql -U postgres
CREATE DATABASE rh_management;
\q
```

### Error: "relation does not exist"
```bash
# Problema: Tablas no creadas
# Solución:
npm run db:migrate
# O manualmente:
psql -U postgres -d rh_management -f database/schema.sql
```

### Error: "ECONNREFUSED" al conectar a PostgreSQL
```bash
# Problema: PostgreSQL no está corriendo
# Solución Windows:
# Servicios > PostgreSQL > Iniciar

# Solución Docker:
docker start rh-postgres

# Verificar que está corriendo:
# Windows:
sc query postgresql-x64-16

# Docker:
docker ps
```

### Error: TypeScript compilation errors
```bash
# Problema: Errores de compilación
# Solución:
# 1. Verificar tsconfig.json
# 2. Reinstalar @types
npm install --save-dev @types/node @types/express @types/react

# 3. Limpiar cache
npm run clean
npm run build
```

### Error: "Cannot read properties of undefined"
```bash
# Problema: Variables de entorno no cargadas
# Solución:
# 1. Verificar que .env existe
ls -la .env

# 2. Verificar contenido
cat .env

# 3. Reiniciar servidor
npm run server:dev
```

## 🔧 Comandos de Mantenimiento

### Limpiar Proyecto
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar cache de npm
npm cache clean --force

# Limpiar build
rm -rf dist
```

### Actualizar Dependencias
```bash
# Ver dependencias desactualizadas
npm outdated

# Actualizar todas las dependencias
npm update

# Actualizar una dependencia específica
npm install express@latest
```

### Logs y Debugging
```bash
# Ver logs del servidor
npm run server:dev

# Ver logs de PostgreSQL (Windows)
# C:\Program Files\PostgreSQL\16\data\log\

# Ver logs de PostgreSQL (Docker)
docker logs rh-postgres

# Modo debug de Node.js
NODE_ENV=development DEBUG=* npm run server:dev
```

## 📊 Comandos SQL Útiles

### Consultas de Información
```sql
-- Ver tamaño de la base de datos
SELECT pg_size_pretty(pg_database_size('rh_management'));

-- Ver tamaño de cada tabla
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver número de registros por tabla
SELECT 
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Ver índices
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

### Mantenimiento de Base de Datos
```sql
-- Vacuum (limpiar espacio)
VACUUM ANALYZE;

-- Reindexar
REINDEX DATABASE rh_management;

-- Ver conexiones activas
SELECT * FROM pg_stat_activity WHERE datname = 'rh_management';

-- Terminar conexiones (cuidado!)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'rh_management' AND pid <> pg_backend_pid();
```

### Reset de Datos
```sql
-- Eliminar todos los datos (mantener estructura)
TRUNCATE TABLE asistencias, permisos, vacaciones, incapacidades, 
                biometricos, usuarios, empleados CASCADE;

-- Reiniciar secuencias
ALTER SEQUENCE empleados_id_seq RESTART WITH 1;
ALTER SEQUENCE asistencias_id_seq RESTART WITH 1;
-- ... (para cada tabla)

-- Recargar datos de prueba
\i database/seed.sql
```

## 🧪 Testing

### Probar Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Obtener empleados
curl http://localhost:3000/api/empleados

# Crear empleado (POST)
curl -X POST http://localhost:3000/api/empleados \
  -H "Content-Type: application/json" \
  -d '{
    "numero_empleado": "TEST001",
    "nombre": "Test",
    "apellido_paterno": "Usuario",
    "email": "test@test.com",
    "fecha_ingreso": "2024-01-01"
  }'

# Registrar entrada
curl -X POST http://localhost:3000/api/asistencias/entrada \
  -H "Content-Type: application/json" \
  -d '{
    "empleado_id": 1,
    "tipo_registro": "faceid",
    "datos_biometricos": "test_data"
  }'
```

## 📱 Accesos Rápidos

### URLs Importantes
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Health: http://localhost:3000/health
- pgAdmin: http://localhost:5050 (si está instalado)

### Archivos de Configuración
- `.env` - Variables de entorno
- `package.json` - Dependencias y scripts
- `tsconfig.json` - Configuración TypeScript
- `vite.config.ts` - Configuración Vite
- `database/schema.sql` - Schema de BD

### Logs
- Backend: Consola donde ejecutaste `npm run server:dev`
- Frontend: Consola del navegador (F12)
- PostgreSQL: Ver DATABASE_SETUP.md

## 🆘 Ayuda Adicional

### Recursos
- Documentación PostgreSQL: https://www.postgresql.org/docs/
- Documentación Express: https://expressjs.com/
- Documentación React: https://react.dev/
- Documentación TypeScript: https://www.typescriptlang.org/

### Comandos de Ayuda
```bash
# Ver ayuda de npm
npm help

# Ver scripts disponibles
npm run

# Ver versión de dependencias
npm list <package-name>

# Ver información del paquete
npm info <package-name>
```

---

**Tip**: Guarda este archivo como referencia rápida para resolver problemas comunes.
