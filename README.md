# Sistema de Gestión de Recursos Humanos

Sistema completo de gestión de Recursos Humanos con control biométrico (Face ID y huella dactilar), gestión de permisos, vacaciones e incapacidades y comedor.

## 🚀 Características

- ✅ **Gestión de Empleados**: CRUD completo de empleados
- 🔐 **Asistencias Biométricas**: Control de entrada/salida con Face ID y huella dactilar
- 📝 **Permisos**: Solicitud y aprobación de permisos
- 🏖️ **Vacaciones**: Gestión de vacaciones con cálculo automático según antigüedad
- 🏥 **Incapacidades**: Registro y seguimiento de incapacidades médicas
- 📊 **Reportes**: Reportes detallados de asistencias y estadísticas

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- bcrypt (encriptación)
- jsonwebtoken (autenticación)

### Frontend
- React 18
- TypeScript
- Vite
- CSS Modules

## 📋 Requisitos Previos

- Node.js 18 o superior
- PostgreSQL 12 o superior
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
cd c:/Users/Pablo/Documents/antigravity/RH
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rh_management
DB_USER=postgres
DB_PASSWORD=tu_password

PORT=3000
NODE_ENV=development

JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=24h
```

4. **Crear la base de datos**
```bash
# Conéctate a PostgreSQL
psql -U postgres

# Crea la base de datos
CREATE DATABASE rh_management;

# Sal de psql
\q
```

5. **Ejecutar el schema de la base de datos**
```bash
psql -U postgres -d rh_management -f database/schema.sql
```

## 🚀 Ejecución

### Desarrollo (Backend y Frontend simultáneamente)
```bash
npm run dev
```

### Solo Backend
```bash
npm run server:dev
```

### Solo Frontend
```bash
npm run client:dev
```

### Producción
```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
RH/
├── database/
│   └── schema.sql              # Schema de PostgreSQL
├── src/
│   ├── server/                 # Backend
│   │   ├── database/
│   │   │   └── connection.ts   # Conexión a PostgreSQL
│   │   ├── services/           # Lógica de negocio
│   │   │   ├── empleadoService.ts
│   │   │   ├── asistenciaService.ts
│   │   │   ├── permisoService.ts
│   │   │   ├── vacacionService.ts
│   │   │   └── incapacidadService.ts
│   │   ├── routes/             # Rutas API
│   │   │   ├── empleados.ts
│   │   │   ├── asistencias.ts
│   │   │   ├── permisos.ts
│   │   │   ├── vacaciones.ts
│   │   │   └── incapacidades.ts
│   │   ├── types/              # Tipos TypeScript
│   │   │   └── index.ts
│   │   └── index.ts            # Servidor principal
│   └── client/                 # Frontend
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── BiometricAuth.tsx
│       │   └── ...
│       ├── services/
│       │   └── api.ts          # Cliente API
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🔌 API Endpoints

### Empleados
- `GET /api/empleados` - Obtener todos los empleados
- `GET /api/empleados/:id` - Obtener empleado por ID
- `POST /api/empleados` - Crear empleado
- `PUT /api/empleados/:id` - Actualizar empleado
- `DELETE /api/empleados/:id` - Desactivar empleado

### Asistencias
- `POST /api/asistencias/entrada` - Registrar entrada
- `POST /api/asistencias/salida` - Registrar salida
- `POST /api/asistencias/biometrico` - Registrar datos biométricos
- `GET /api/asistencias/empleado/:id` - Asistencias por empleado
- `GET /api/asistencias/dia/:fecha?` - Asistencias del día
- `GET /api/asistencias/reporte` - Reporte de asistencias

### Permisos
- `POST /api/permisos` - Crear permiso
- `GET /api/permisos/empleado/:id` - Permisos por empleado
- `GET /api/permisos/pendientes` - Permisos pendientes
- `PUT /api/permisos/:id/aprobar` - Aprobar permiso
- `PUT /api/permisos/:id/rechazar` - Rechazar permiso

### Vacaciones
- `POST /api/vacaciones` - Solicitar vacaciones
- `GET /api/vacaciones/empleado/:id` - Vacaciones por empleado
- `GET /api/vacaciones/balance/:id/:year` - Balance de vacaciones
- `GET /api/vacaciones/pendientes` - Vacaciones pendientes
- `PUT /api/vacaciones/:id/aprobar` - Aprobar vacaciones
- `PUT /api/vacaciones/:id/rechazar` - Rechazar vacaciones

### Incapacidades
- `POST /api/incapacidades` - Crear incapacidad
- `GET /api/incapacidades/empleado/:id` - Incapacidades por empleado
- `GET /api/incapacidades/activas` - Incapacidades activas
- `PUT /api/incapacidades/:id/finalizar` - Finalizar incapacidad
- `PUT /api/incapacidades/:id/cancelar` - Cancelar incapacidad

## 🔐 Seguridad

- Autenticación biométrica con hash SHA-256
- Contraseñas encriptadas con bcrypt
- JWT para sesiones
- Helmet para seguridad HTTP
- CORS configurado
- Validación de datos en backend

## 📊 Base de Datos

El sistema utiliza PostgreSQL con las siguientes tablas principales:

- `empleados` - Información de empleados
- `biometricos` - Datos biométricos (Face ID y huella)
- `asistencias` - Registro de entradas y salidas
- `permisos` - Solicitudes de permisos
- `vacaciones` - Gestión de vacaciones
- `incapacidades` - Registro de incapacidades
- `usuarios` - Usuarios del sistema
- `catalogos` - Catálogos configurables
- `configuracion` - Configuración del sistema

## 🎨 Interfaz de Usuario

- Diseño moderno con modo oscuro
- Animaciones suaves y micro-interacciones
- Glassmorphism y gradientes
- Responsive design
- Iconos emoji para mejor UX
- Notificaciones en tiempo real

## 📝 Licencia

ISC

## 👥 Autor

Sistema desarrollado para la gestión de Recursos Humanos

---

**Nota**: Este es un sistema completo y funcional. Para uso en producción, asegúrate de:
1. Cambiar las credenciales por defecto
2. Configurar SSL/TLS
3. Implementar autenticación biométrica real
4. Configurar backups de la base de datos
5. Implementar logging y monitoreo
