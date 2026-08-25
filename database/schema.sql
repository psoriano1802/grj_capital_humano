-- Database: rh_management
-- Description: Sistema de Gestión de Recursos Humanos

SET client_encoding = 'UTF8';

-- Tabla de Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    numero_empleado VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    fecha_ingreso DATE NOT NULL,
    puesto VARCHAR(100),
    departamento VARCHAR(100),
    salario DECIMAL(10, 2),
    estatus VARCHAR(20) DEFAULT 'activo',
    foto_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Columnas de contratacion (idempotente; ya registradas en el UI de Empleados)
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_contrato VARCHAR(100);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_contratacion VARCHAR(100);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_empleado VARCHAR(100);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_jornada VARCHAR(100);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS turno VARCHAR(100);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS horario_laboral VARCHAR(100);
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS esquema_pago VARCHAR(100);

-- Vínculos organizacionales para lógica de aprobaciones jerárquicas
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS puesto_id INTEGER;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS departamento_id INTEGER;

-- Tabla de Datos Biométricos
CREATE TABLE IF NOT EXISTS biometricos (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL, -- 'faceid' o 'huella'
    datos_biometricos TEXT NOT NULL, -- Hash o template biométrico
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empleado_id, tipo)
);

-- Tabla de Asistencias
CREATE TABLE IF NOT EXISTS asistencias (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_entrada TIMESTAMP,
    hora_salida TIMESTAMP,
    tipo_registro VARCHAR(20), -- 'faceid', 'huella', 'manual'
    estatus VARCHAR(20) DEFAULT 'presente', -- 'presente', 'tarde', 'falta', 'justificado'
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empleado_id, fecha)
);

-- Tabla de Permisos
CREATE TABLE IF NOT EXISTS permisos (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    tipo_permiso VARCHAR(50) NOT NULL, -- 'personal', 'medico', 'estudio', etc.
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    horas_solicitadas DECIMAL(5, 2),
    motivo TEXT NOT NULL,
    estatus VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    aprobado_por INTEGER REFERENCES empleados(id),
    fecha_aprobacion TIMESTAMP,
    comentarios_aprobacion TEXT,
    documento_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Vacaciones
CREATE TABLE IF NOT EXISTS vacaciones (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    periodo_year INTEGER NOT NULL,
    dias_disponibles INTEGER NOT NULL,
    dias_tomados INTEGER DEFAULT 0,
    dias_pendientes INTEGER NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    estatus VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado', 'en_curso', 'completado'
    aprobado_por INTEGER REFERENCES empleados(id),
    fecha_aprobacion TIMESTAMP,
    comentarios TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (empleado_id, periodo_year)
);

-- Deduplica filas y agrega la restricción UNIQUE a bases existentes
-- creadas antes de incluirla en el CREATE TABLE.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'vacaciones_empleado_id_periodo_year_key'
          AND conrelid = 'vacaciones'::regclass
    ) THEN
        DELETE FROM vacaciones v
        USING vacaciones d
        WHERE v.id > d.id
          AND v.empleado_id = d.empleado_id
          AND v.periodo_year = d.periodo_year;
        ALTER TABLE vacaciones
            ADD CONSTRAINT vacaciones_empleado_id_periodo_year_key
            UNIQUE (empleado_id, periodo_year);
    END IF;
END $$;

-- Tabla de Incapacidades
CREATE TABLE IF NOT EXISTS incapacidades (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    tipo_incapacidad VARCHAR(50) NOT NULL, -- 'enfermedad_general', 'riesgo_trabajo', 'maternidad', etc.
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_totales INTEGER NOT NULL,
    folio_incapacidad VARCHAR(100),
    institucion VARCHAR(100), -- 'IMSS', 'ISSSTE', 'Particular'
    diagnostico TEXT,
    documento_url VARCHAR(255),
    estatus VARCHAR(20) DEFAULT 'activa', -- 'activa', 'finalizada', 'cancelada'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios (para autenticación)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL, -- 'admin', 'rh', 'empleado', 'supervisor'
    ultimo_acceso TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Catálogos (para opciones configurables)
CREATE TABLE IF NOT EXISTS catalogos (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL, -- 'departamento', 'puesto', 'tipo_permiso', etc.
    clave VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    UNIQUE(categoria, clave)
);

-- Tabla de Configuración del Sistema
CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_numero ON empleados(numero_empleado);
CREATE INDEX IF NOT EXISTS idx_empleados_estatus ON empleados(estatus);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_empleado ON asistencias(empleado_id);
CREATE INDEX IF NOT EXISTS idx_permisos_empleado ON permisos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_permisos_estatus ON permisos(estatus);
CREATE INDEX IF NOT EXISTS idx_vacaciones_empleado ON vacaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_incapacidades_empleado ON incapacidades(empleado_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_empleados_updated_at ON empleados;
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permisos_updated_at ON permisos;
CREATE TRIGGER update_permisos_updated_at BEFORE UPDATE ON permisos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vacaciones_updated_at ON vacaciones;
CREATE TRIGGER update_vacaciones_updated_at BEFORE UPDATE ON vacaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incapacidades_updated_at ON incapacidades;
CREATE TRIGGER update_incapacidades_updated_at BEFORE UPDATE ON incapacidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de catálogos iniciales
INSERT INTO catalogos (categoria, clave, valor, descripcion) VALUES
    ('departamento', 'RRHH', 'Recursos Humanos', 'Departamento de Recursos Humanos'),
    ('departamento', 'IT', 'Tecnología', 'Departamento de Tecnología'),
    ('departamento', 'VENTAS', 'Ventas', 'Departamento de Ventas'),
    ('departamento', 'ADMIN', 'Administración', 'Departamento Administrativo'),
    ('tipo_permiso', 'PERSONAL', 'Permiso Personal', 'Asuntos personales'),
    ('tipo_permiso', 'MEDICO', 'Permiso Médico', 'Cita médica'),
    ('tipo_permiso', 'ESTUDIO', 'Permiso de Estudio', 'Asuntos académicos'),
    ('tipo_permiso', 'FAMILIAR', 'Permiso Familiar', 'Asuntos familiares'),
    ('tipo_incapacidad', 'ENFERMEDAD', 'Enfermedad General', 'Incapacidad por enfermedad'),
    ('tipo_incapacidad', 'RIESGO', 'Riesgo de Trabajo', 'Incapacidad por riesgo laboral'),
    ('tipo_incapacidad', 'MATERNIDAD', 'Maternidad', 'Incapacidad por maternidad'),
    ('tipo_incapacidad', 'PATERNIDAD', 'Paternidad', 'Incapacidad por paternidad')
ON CONFLICT (categoria, clave) DO NOTHING;

-- Insertar configuraciones iniciales
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
    ('dias_vacaciones_anuales', '12', 'number', 'Días de vacaciones por año'),
    ('hora_entrada_laboral', '09:00', 'string', 'Hora de entrada laboral'),
    ('hora_salida_laboral', '18:00', 'string', 'Hora de salida laboral'),
    ('tolerancia_minutos', '10', 'number', 'Minutos de tolerancia para entrada'),
    ('biometrico_faceid_activo', 'true', 'boolean', 'Face ID activo'),
    ('biometrico_huella_activo', 'true', 'boolean', 'Huella dactilar activa')
ON CONFLICT (clave) DO NOTHING;
