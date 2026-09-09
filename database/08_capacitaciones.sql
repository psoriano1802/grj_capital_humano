-- Capacitaciones y cursos para empleados
SET client_encoding = 'UTF8';

-- ── Catálogo de capacitaciones ───────────────────────────────────
CREATE TABLE IF NOT EXISTS capacitaciones (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'interna' CHECK (tipo IN ('interna', 'externa')),
    proveedor VARCHAR(255),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    duracion_horas DECIMAL(5,2) NOT NULL,
    costo DECIMAL(10,2) DEFAULT 0,
    capacidad INTEGER DEFAULT 0,
    modalidad VARCHAR(20) NOT NULL DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'hibrida')),
    archivo_material VARCHAR(500),
    archivo_certificado VARCHAR(500),
    archivo_base64 TEXT,
    estatus VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estatus IN ('activa', 'archivada', 'cancelada')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Inscripciones de empleados a capacitaciones ───────────────────
CREATE TABLE IF NOT EXISTS capacitacion_inscripciones (
    id SERIAL PRIMARY KEY,
    capacitacion_id INTEGER NOT NULL REFERENCES capacitaciones(id) ON DELETE CASCADE,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_completado DATE,
    calificacion DECIMAL(5,2),
    horas_completadas DECIMAL(5,2) DEFAULT 0,
    estatus VARCHAR(30) NOT NULL DEFAULT 'inscrito' CHECK (estatus IN ('inscrito', 'en_proceso', 'completado', 'cancelado', 'reprobado')),
    observaciones TEXT,
    archivo_entrega VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(capitacion_id, empleado_id)
);

-- ── Sesiones/asistentes de cada capacitación ────────────────────
CREATE TABLE IF NOT EXISTS capacitacion_asistentes (
    id SERIAL PRIMARY KEY,
    capacitacion_id INTEGER NOT NULL REFERENCES capacitaciones(id) ON DELETE CASCADE,
    fecha_sesion DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    lugar VARCHAR(255),
    instructor VARCHAR(255),
    temas TEXT,
    duracion_horas DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Control de asistencia por sesión ─────────────────────────────
CREATE TABLE IF NOT EXISTS capacitacion_asistencia_sesion (
    id SERIAL PRIMARY KEY,
    inscripcion_id INTEGER NOT NULL REFERENCES capacitacion_inscripciones(id) ON DELETE CASCADE,
    sesion_id INTEGER NOT NULL REFERENCES capacitacion_asistentes(id) ON DELETE CASCADE,
    presente BOOLEAN DEFAULT false,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inscripcion_id, sesion_id)
);

-- ── Certificados generados ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS capacitacion_certificados (
    id SERIAL PRIMARY KEY,
    inscripcion_id INTEGER NOT NULL REFERENCES capacitacion_inscripciones(id) ON DELETE CASCADE,
    folio VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('participacion', 'culminacion', 'aprovechamiento', 'asistencia')),
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    url_descarga VARCHAR(500),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Notificaciones de capacitaciones ────────────────────────────
CREATE TABLE IF NOT EXISTS capacitacion_notificaciones (
    id SERIAL PRIMARY KEY,
    capacitacion_id INTEGER REFERENCES capacitaciones(id) ON DELETE CASCADE,
    inscripcion_id INTEGER REFERENCES capacitacion_inscripciones(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('inscripcion', 'recordatorio_sesion', 'recordatorio_cierre', 'completado', 'certificado_disponible', 'cancelacion')),
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Índices ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_capacitaciones_estatus ON capacitaciones(estatus);
CREATE INDEX IF NOT EXISTS idx_capacitaciones_fecha ON capacitaciones(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_inscripciones_cap ON capacitacion_inscripciones("capacitacion_id");
CREATE INDEX IF NOT EXISTS idx_inscripciones_emp ON capacitacion_inscripciones("empleado_id");
CREATE INDEX IF NOT EXISTS idx_inscripciones_estatus ON capacitacion_inscripciones(estatus);
CREATE INDEX IF NOT EXISTS idx_asistentes_cap ON capacitacion_asistentes("capacitacion_id");
CREATE INDEX IF NOT EXISTS idx_asistencia_sesion ON capacitacion_asistencia_sesion(sesion_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_inscripcion ON capacitacion_asistencia_sesion(inscripcion_id);
CREATE INDEX IF NOT EXISTS idx_certificados_folio ON capacitacion_certificados(folio);
CREATE INDEX IF NOT EXISTS idx_notif_leida ON capacitacion_notificaciones(leida);

-- ── Triggers ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS update_capacitaciones_updated_at ON capacitaciones;
CREATE TRIGGER update_capacitaciones_updated_at BEFORE UPDATE ON capacitaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inscripciones_updated_at ON capacitacion_inscripciones;
CREATE TRIGGER update_inscripciones_updated_at BEFORE UPDATE ON capacitacion_inscripciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
