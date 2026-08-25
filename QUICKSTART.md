# Guía de Inicio Rápido - Sistema RH

## 🚀 Instalación Rápida

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar PostgreSQL

#### Opción A: Usando psql
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE rh_management;

# Salir
\q
```

#### Opción B: Usando pgAdmin
1. Abrir pgAdmin
2. Crear nueva base de datos llamada `rh_management`

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh_management
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_AQUI
```

### 4. Crear las Tablas

Ejecuta el schema SQL:
```bash
psql -U postgres -d rh_management -f database/schema.sql
```

O usa el script de migración:
```bash
npm run db:migrate
```

### 5. (Opcional) Insertar Datos de Prueba

```bash
psql -U postgres -d rh_management -f database/seed.sql
```

### 6. Iniciar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📱 Uso Rápido

### Registro de Asistencia con Biométricos

1. Abre http://localhost:5173
2. En el menú lateral, ve a **Asistencias** → **Registro de Asistencia**
3. Ingresa tu número de empleado (ej: `EMP001` si usaste los datos de prueba)
4. Selecciona **Face ID** o **Huella Dactilar**
5. Haz clic en **Iniciar Escaneo**

### Solicitar Permiso

1. Ve a **Permisos** → **Solicitar Permiso**
2. Llena el formulario:
   - Tipo de permiso
   - Fechas
   - Motivo
3. Envía la solicitud

### Solicitar Vacaciones

1. Ve a **Vacaciones** → **Solicitar Vacaciones**
2. Revisa tu balance de días disponibles
3. Selecciona las fechas deseadas
4. Envía la solicitud

### Registrar Incapacidad

1. Ve a **Incapacidades** → **Registrar Incapacidad**
2. Llena el formulario con:
   - Tipo de incapacidad
   - Fechas
   - Folio IMSS/ISSSTE
   - Diagnóstico
3. Guarda el registro

## 🔧 Comandos Útiles

```bash
# Desarrollo (backend + frontend)
npm run dev

# Solo backend
npm run server:dev

# Solo frontend
npm run client:dev

# Migrar base de datos
npm run db:migrate

# Build para producción
npm run build

# Iniciar en producción
npm start
```

## 📊 Datos de Prueba

Si ejecutaste `seed.sql`, tendrás estos empleados de prueba:

| Número | Nombre | Puesto | Departamento |
|--------|--------|--------|--------------|
| EMP001 | Juan García | Desarrollador Senior | IT |
| EMP002 | María Rodríguez | Gerente de RH | RRHH |
| EMP003 | Carlos Hernández | Analista de Ventas | VENTAS |
| EMP004 | Ana Martínez | Asistente Administrativa | ADMIN |
| EMP005 | Luis López | Coordinador de IT | IT |

## 🐛 Solución de Problemas

### Error de conexión a PostgreSQL
- Verifica que PostgreSQL esté corriendo
- Confirma las credenciales en `.env`
- Asegúrate de que la base de datos existe

### Puerto 3000 o 5173 en uso
- Cambia el puerto en `.env` (backend) o `vite.config.ts` (frontend)

### Error al migrar
- Verifica que el archivo `schema.sql` existe
- Confirma que tienes permisos en PostgreSQL

## 📚 Próximos Pasos

1. **Personalizar**: Modifica los catálogos según tus necesidades
2. **Seguridad**: Cambia el `JWT_SECRET` en producción
3. **Usuarios**: Crea usuarios con diferentes roles
4. **Reportes**: Explora los endpoints de reportes
5. **Biométricos**: Integra dispositivos biométricos reales

## 🆘 Ayuda

Si necesitas ayuda:
1. Revisa el `README.md` completo
2. Verifica los logs en la consola
3. Usa el endpoint `/health` para verificar el estado

## 🎉 ¡Listo!

Tu sistema de RH está configurado y listo para usar. Explora todas las funcionalidades desde el menú lateral.
