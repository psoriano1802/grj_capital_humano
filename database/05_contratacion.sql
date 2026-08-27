-- database/contratacion.sql
-- Módulo de Contratación: Catálogos

SET client_encoding = 'UTF8';

-- 1. Tipos de contratación
CREATE TABLE IF NOT EXISTS cat_tipos_contratacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tipos de empleado
CREATE TABLE IF NOT EXISTS cat_tipos_empleado (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tipos de jornada
CREATE TABLE IF NOT EXISTS cat_tipos_jornada (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Turnos
CREATE TABLE IF NOT EXISTS cat_turnos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Horarios laborales
CREATE TABLE IF NOT EXISTS cat_horarios_laborales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Políticas de comida / descanso
CREATE TABLE IF NOT EXISTS cat_politicas_descanso (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Calendarios laborales
CREATE TABLE IF NOT EXISTS cat_calendarios_laborales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Prestaciones
CREATE TABLE IF NOT EXISTS cat_prestaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tipos de salario o esquema de pago
CREATE TABLE IF NOT EXISTS cat_esquemas_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tipos de contrato
CREATE TABLE IF NOT EXISTS cat_tipos_contrato (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INSERCIÓN DE DATOS SEMILLA
-- ==========================================

INSERT INTO cat_tipos_contratacion (nombre, descripcion) VALUES
('Temporal', 'Contratación por tiempo definido'),
('Permanente', 'Contrato indefinido estándar'),
('Por proyecto', 'Contratación ligada a la duración de un proyecto'),
('Capacitación inicial', 'Contrato especial para periodo de capacitación')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_tipos_empleado (nombre, descripcion) VALUES
('Administrativo', 'Personal en áreas de oficina o soporte'),
('Operativo', 'Personal de planta, producción o campo'),
('Eventual', 'Personal contratado ocasionalmente'),
('Confianza', 'Personal con nivel gerencial o roles de confianza')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_tipos_jornada (nombre, descripcion) VALUES
('Diurna', 'Jornada legal diurna'),
('Nocturna', 'Jornada legal nocturna'),
('Mixta', 'Jornada mixta de ambos turnos')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_turnos (nombre, descripcion) VALUES
('Matutino', 'Turno por la mañana'),
('Vespertino', 'Turno por la tarde'),
('Nocturno', 'Turno de noche'),
('Rotativo', 'Turno que cambia cíclicamente')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_horarios_laborales (nombre, descripcion) VALUES
('08:00-17:00', 'Horario de oficina tradicional temprano'),
('09:00-18:00', 'Horario de oficina tradicional'),
('12x12', '12 horas de trabajo por 12 de descanso'),
('24x24', '24 horas de trabajo por 24 de descanso')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_politicas_descanso (nombre, descripcion) VALUES
('30 min comida', 'Media hora para toma de alimentos'),
('60 min comida', 'Una hora completa para alimentos'),
('15 min descanso', 'Quince minutos de pausa o break')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_calendarios_laborales (nombre, descripcion) VALUES
('Lunes a viernes', 'Días hábiles estándar de oficina'),
('Lunes a sábado', 'Seis días laborables'),
('Calendario operativo', 'Roles continuos o de planta')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_prestaciones (nombre, descripcion) VALUES
('IMSS', 'Seguridad social IMSS'),
('Aguinaldo', 'Pago anual de aguinaldo'),
('Prima vacacional', 'Bono prima de vacaciones'),
('Bono', 'Bono de productividad o puntualidad'),
('Vales', 'Vales de despensa o gasolina')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_esquemas_pago (nombre, descripcion) VALUES
('Semanal', 'Pago cada semana'),
('Quincenal', 'Pago cada 15 días'),
('Mensual', 'Pago una vez al mes'),
('Mixto', 'Esquema híbrido o asimilados')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cat_tipos_contrato (nombre, descripcion) VALUES
('Indeterminado', 'Contrato laboral estándar'),
('Determinado', 'Contrato con fecha de fin especificada'),
('Eventual', 'Contrato para un momento específico'),
('Prueba', 'Contrato sujeto a un periodo de prueba')
ON CONFLICT (nombre) DO NOTHING;
