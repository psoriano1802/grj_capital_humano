# 🗄️ Configuración de PostgreSQL para Sistema RH

## Opción 1: Instalación Local de PostgreSQL

### Windows

1. **Descargar PostgreSQL**
   - Visita: https://www.postgresql.org/download/windows/
   - Descarga el instalador de PostgreSQL 16 (o superior)

2. **Instalar PostgreSQL**
   - Ejecuta el instalador
   - Puerto por defecto: `5432`
   - Contraseña para usuario `postgres`: (anota esta contraseña)
   - Instala pgAdmin 4 (incluido)

3. **Verificar Instalación**
   ```bash
   psql --version
   ```

### Crear Base de Datos

#### Usando psql (Línea de comandos)
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE rh_management;

# Verificar que se creó
\l

# Salir
\q
```

#### Usando pgAdmin 4 (GUI)
1. Abrir pgAdmin 4
2. Conectarse al servidor local
3. Click derecho en "Databases" → "Create" → "Database"
4. Nombre: `rh_management`
5. Owner: `postgres`
6. Click "Save"

## Opción 2: PostgreSQL con Docker

### Instalar Docker Desktop
1. Descargar: https://www.docker.com/products/docker-desktop
2. Instalar Docker Desktop
3. Iniciar Docker Desktop

### Ejecutar PostgreSQL en Docker
```bash
# Crear y ejecutar contenedor de PostgreSQL
docker run --name rh-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rh_management \
  -p 5432:5432 \
  -d postgres:16

# Verificar que está corriendo
docker ps

# Ver logs
docker logs rh-postgres
```

### Comandos útiles de Docker
```bash
# Detener el contenedor
docker stop rh-postgres

# Iniciar el contenedor
docker start rh-postgres

# Eliminar el contenedor
docker rm rh-postgres

# Conectarse al contenedor
docker exec -it rh-postgres psql -U postgres -d rh_management
```

## Opción 3: PostgreSQL en la Nube

### Supabase (Gratis)
1. Visita: https://supabase.com
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Obtén las credenciales de conexión
5. Actualiza tu `.env`:
   ```env
   DB_HOST=db.xxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=tu_password_de_supabase
   ```

### Neon (Gratis)
1. Visita: https://neon.tech
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la cadena de conexión
5. Actualiza tu `.env`

## Configurar el Proyecto

### 1. Actualizar archivo .env

Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
# Para instalación local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh_management
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_AQUI

# Para Docker (si usas la configuración de arriba)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh_management
DB_USER=postgres
DB_PASSWORD=postgres
```

### 2. Ejecutar Migraciones

#### Opción A: Usando psql
```bash
psql -U postgres -d rh_management -f database/schema.sql
```

#### Opción B: Usando el script de migración
```bash
npm run db:migrate
```

### 3. (Opcional) Insertar Datos de Prueba
```bash
psql -U postgres -d rh_management -f database/seed.sql
```

## Verificar la Conexión

### Desde la aplicación
```bash
# Iniciar el servidor
npm run server:dev

# Deberías ver:
# ✅ Conexión a PostgreSQL exitosa
```

### Desde psql
```bash
# Conectarse
psql -U postgres -d rh_management

# Listar tablas
\dt

# Ver empleados (si insertaste datos de prueba)
SELECT * FROM empleados;

# Salir
\q
```

## Solución de Problemas

### Error: "psql: command not found"
**Solución**: Agrega PostgreSQL al PATH de Windows
1. Busca la carpeta de instalación (ej: `C:\Program Files\PostgreSQL\16\bin`)
2. Agrégala a las variables de entorno PATH

### Error: "password authentication failed"
**Solución**: Verifica la contraseña en `.env`
- Asegúrate de que coincida con la contraseña que configuraste

### Error: "database does not exist"
**Solución**: Crea la base de datos
```bash
psql -U postgres
CREATE DATABASE rh_management;
\q
```

### Error: "connection refused"
**Solución**: Verifica que PostgreSQL esté corriendo
- Windows: Servicios → PostgreSQL debe estar "En ejecución"
- Docker: `docker ps` debe mostrar el contenedor

### Puerto 5432 en uso
**Solución**: Cambia el puerto
1. En PostgreSQL: Edita `postgresql.conf`
2. En Docker: Usa `-p 5433:5432`
3. Actualiza `DB_PORT` en `.env`

## Comandos Útiles de PostgreSQL

```sql
-- Ver todas las bases de datos
\l

-- Conectarse a una base de datos
\c rh_management

-- Listar todas las tablas
\dt

-- Describir una tabla
\d empleados

-- Ver usuarios
\du

-- Ejecutar un archivo SQL
\i database/schema.sql

-- Ver tamaño de la base de datos
SELECT pg_size_pretty(pg_database_size('rh_management'));

-- Backup de la base de datos
pg_dump -U postgres rh_management > backup.sql

-- Restaurar backup
psql -U postgres rh_management < backup.sql
```

## Seguridad en Producción

1. **Cambiar contraseña por defecto**
   ```sql
   ALTER USER postgres WITH PASSWORD 'nueva_contraseña_segura';
   ```

2. **Crear usuario específico para la aplicación**
   ```sql
   CREATE USER rh_app WITH PASSWORD 'password_seguro';
   GRANT ALL PRIVILEGES ON DATABASE rh_management TO rh_app;
   ```

3. **Configurar SSL**
   - Habilita SSL en `postgresql.conf`
   - Actualiza la cadena de conexión

4. **Firewall**
   - Permite solo conexiones desde IPs específicas
   - Cierra el puerto 5432 al público

## Recursos Adicionales

- **Documentación oficial**: https://www.postgresql.org/docs/
- **pgAdmin**: https://www.pgadmin.org/
- **Tutorial PostgreSQL**: https://www.postgresqltutorial.com/

---

Una vez configurado PostgreSQL, continúa con el [QUICKSTART.md](QUICKSTART.md) para iniciar la aplicación.
