-- Database: rh_management
-- Description: Seguridad - Perfiles, Accesos y Configuracion de Usuarios
-- Tablas: perfiles, accesos, perfil_accesos. Columnas extra en empleados.

SET client_encoding = 'UTF8';

-- ── Tabla de Perfiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfiles (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,        -- ej. ADMIN, RH, EMPLEADO, SUPERVISOR
    nombre VARCHAR(100) NOT NULL,             -- nombre legible del perfil
    descripcion TEXT,
    nivel_jerarquico INTEGER DEFAULT 0,       -- 0 = base, mayor = mas privilegios
    es_administrador BOOLEAN DEFAULT false,   -- si true, tiene acceso a todo
    estatus VARCHAR(20) DEFAULT 'activo',     -- 'activo', 'inactivo'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Tabla de Accesos (modulos / procesos del sistema) ────────────
CREATE TABLE IF NOT EXISTS accesos (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,       -- clave del menu en el frontend (ej. empleados, solicitar-permiso)
    nombre VARCHAR(150) NOT NULL,             -- nombre legible del acceso
    descripcion TEXT,
    modulo VARCHAR(100),                      -- grupo/padre del menu (ej. recursos-humanos, permisos)
    icono VARCHAR(20) DEFAULT '📌',
    ruta VARCHAR(100),                        -- ruta/menu id del frontend
    estatus VARCHAR(20) DEFAULT 'activo',     -- 'activo', 'inactivo'
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Tabla de Asignacion de Accesos por Perfil ────────────────────
CREATE TABLE IF NOT EXISTS perfil_accesos (
    id SERIAL PRIMARY KEY,
    perfil_id INTEGER NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    acceso_id INTEGER NOT NULL REFERENCES accesos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (perfil_id, acceso_id)
);

-- ── Columnas de seguridad en empleados (identidad activa) ────────
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS perfil_id INTEGER REFERENCES perfiles(id) ON DELETE SET NULL;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS estatus_usuario VARCHAR(30) DEFAULT 'activo';
ALTER TABLE empleados ALTER COLUMN estatus_usuario TYPE VARCHAR(30) USING estatus_usuario::VARCHAR(30);
    -- 'activo', 'inactivo', 'temporalmente_inactivo'

-- Indices
CREATE INDEX IF NOT EXISTS idx_perfil_accesos_perfil ON perfil_accesos(perfil_id);
CREATE INDEX IF NOT EXISTS idx_perfil_accesos_acceso ON perfil_accesos(acceso_id);
CREATE INDEX IF NOT EXISTS idx_empleados_perfil ON empleados(perfil_id);

-- Triggers de updated_at
DROP TRIGGER IF EXISTS update_perfiles_updated_at ON perfiles;
CREATE TRIGGER update_perfiles_updated_at BEFORE UPDATE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accesos_updated_at ON accesos;
CREATE TRIGGER update_accesos_updated_at BEFORE UPDATE ON accesos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seeds de Accesos (registro de los modulos actuales) ──────────
INSERT INTO accesos (clave, nombre, descripcion, modulo, icono, ruta, estatus, orden) VALUES
    ('pipeline-reclutamiento', 'Pipeline de Reclutamiento', 'Gestion del pipeline de candidatos', 'reclutamiento', '🔄', 'pipeline-reclutamiento', 'activo', 1),
    ('vacantes',               'Vacantes',                 'Gestion de vacantes',                   'reclutamiento', '📋', 'vacantes', 'activo', 2),
    ('aspirantes',             'Aspirantes',               'Gestion de aspirantes',                'reclutamiento', '👤', 'aspirantes', 'activo', 3),
    ('catalogos-reclutamiento','Catálogos',                'Catalogos de reclutamiento',           'reclutamiento', '📚', 'catalogos-reclutamiento', 'activo', 4),

    ('empleados',              'Empleados',                'Gestion de empleados',                 'recursos-humanos', '👔', 'empleados', 'activo', 5),
    ('organizacion',           'Organización',             'Resumen de la organizacion',           'recursos-humanos', '🏢', 'organizacion', 'activo', 6),
    ('org-sucursales',         'Sucursales',               'Gestion de sucursales',                'recursos-humanos', '🏭', 'org-sucursales', 'activo', 7),
    ('org-departamentos',      'Departamentos',            'Gestion de departamentos',             'recursos-humanos', '🗂️', 'org-departamentos', 'activo', 8),
    ('org-puestos',            'Puestos',                  'Gestion de puestos',                   'recursos-humanos', '💼', 'org-puestos', 'activo', 9),
    ('org-centros-costo',      'Centros de Costo',         'Gestion de centros de costo',          'recursos-humanos', '💰', 'org-centros-costo', 'activo', 10),
    ('org-organigrama',        'Organigrama',              'Grafica del organigrama',              'recursos-humanos', '🌲', 'org-organigrama', 'activo', 11),
    ('org-ubicaciones',        'Ubicaciones',              'Gestion de ubicaciones fisicas',       'recursos-humanos', '📍', 'org-ubicaciones', 'activo', 12),
    ('contratacion',           'Contratación',             'Proceso de contratacion',              'recursos-humanos', '🤝', 'contratacion', 'activo', 13),
    ('nomina',                 'Nómina',                   'Gestion de nomina',                    'recursos-humanos', '💵', 'nomina', 'activo', 14),
    ('control-cvs',            'Control de CVs',           'Control de curriculum vitae',          'recursos-humanos', '📄', 'control-cvs', 'activo', 15),

    ('registro-asistencia',    'Registro de Asistencia',   'Registro biometrico de asistencia',    'asistencias', '✓', 'registro-asistencia', 'activo', 16),
    ('reporte-asistencias',    'Reporte de Asistencias',   'Reportes de asistencia',               'asistencias', '📊', 'reporte-asistencias', 'activo', 17),
    ('configuracion-biometrico','Configuración Biométrica','Configuracion del biometrico',         'asistencias', '🔐', 'configuracion-biometrico', 'activo', 18),

    ('solicitar-permiso',      'Solicitar Permiso',        'Solicitud de permiso',                 'permisos', '➕', 'solicitar-permiso', 'activo', 19),
    ('mis-permisos',           'Mis Permisos',             'Historial de permisos del empleado',   'permisos', '📋', 'mis-permisos', 'activo', 20),
    ('aprobar-permisos',       'Aprobar Permisos',         'Aprobacion de permisos',               'permisos', '✅', 'aprobar-permisos', 'activo', 21),

    ('solicitar-vacaciones',   'Solicitar Vacaciones',     'Solicitud de vacaciones',              'vacaciones', '➕', 'solicitar-vacaciones', 'activo', 22),
    ('mis-vacaciones',         'Mis Vacaciones',           'Historial de vacaciones del empleado', 'vacaciones', '📅', 'mis-vacaciones', 'activo', 23),
    ('aprobar-vacaciones',     'Aprobar Vacaciones',       'Aprobacion de vacaciones',             'vacaciones', '✅', 'aprobar-vacaciones', 'activo', 24),
    ('balance-vacaciones',     'Balance de Vacaciones',    'Balance general de vacaciones (RH)',   'vacaciones', '📊', 'balance-vacaciones', 'activo', 25),

    ('registrar-incapacidad',  'Registrar Incapacidad',    'Registro de incapacidad',              'incapacidades', '➕', 'registrar-incapacidad', 'activo', 26),
    ('mis-incapacidades',      'Mis Incapacidades',        'Historial de incapacidades',           'incapacidades', '📋', 'mis-incapacidades', 'activo', 27),
    ('incapacidades-activas',  'Incapacidades Activas',    'Consulta de incapacidades activas',    'incapacidades', '🔴', 'incapacidades-activas', 'activo', 28),

    ('seguridad',              'Configuración de Seguridad','Perfiles, accesos y usuarios',        'seguridad', '🛡️', 'seguridad', 'activo', 29)
ON CONFLICT (clave) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    modulo = EXCLUDED.modulo,
    icono = EXCLUDED.icono,
    ruta = EXCLUDED.ruta;

-- ── Seeds de Perfiles ────────────────────────────────────────────
INSERT INTO perfiles (clave, nombre, descripcion, nivel_jerarquico, es_administrador, estatus) VALUES
    ('ADMIN',   'Administrador',       'Acceso total al sistema (todos los modulos).', 100, true, 'activo'),
    ('RH',      'Recursos Humanos',    'Gestion operativa de RH: empleados, organizacion, aprobaciones y reportes.', 50, false, 'activo'),
    ('SUPERVISOR', 'Supervisor',       'Aprobacion de permisos y vacaciones de su equipo.', 30, false, 'activo'),
    ('EMPLEADO','Empleado',            'Funciones personales: solicitudes y consulta de su historial.', 10, false, 'activo')
ON CONFLICT (clave) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    nivel_jerarquico = EXCLUDED.nivel_jerarquico,
    es_administrador = EXCLUDED.es_administrador;

-- ── Asignacion de accesos a cada perfil ──────────────────────────

-- ADMIN: todos los accesos
INSERT INTO perfil_accesos (perfil_id, acceso_id)
SELECT p.id, a.id FROM perfiles p, accesos a
WHERE p.clave = 'ADMIN' AND a.estatus = 'activo'
ON CONFLICT (perfil_id, acceso_id) DO NOTHING;

-- RH: personal, organizacion, empleados, reportes y aprobaciones
INSERT INTO perfil_accesos (perfil_id, acceso_id)
SELECT p.id, a.id FROM perfiles p, accesos a
WHERE p.clave = 'RH' AND a.clave IN (
    'empleados', 'organizacion', 'org-sucursales', 'org-departamentos', 'org-puestos',
    'org-centros-costo', 'org-organigrama', 'org-ubicaciones', 'contratacion',
    'reporte-asistencias', 'configuracion-biometrico', 'incapacidades-activas',
    'aprobar-permisos', 'aprobar-vacaciones', 'balance-vacaciones'
)
ON CONFLICT (perfil_id, acceso_id) DO NOTHING;

-- SUPERVISOR: consumir y aprobar solicitudes de su equipo
INSERT INTO perfil_accesos (perfil_id, acceso_id)
SELECT p.id, a.id FROM perfiles p, accesos a
WHERE p.clave = 'SUPERVISOR' AND a.clave IN (
    'solicitar-permiso', 'mis-permisos', 'aprobar-permisos',
    'solicitar-vacaciones', 'mis-vacaciones', 'aprobar-vacaciones',
    'registro-asistencia', 'reporte-asistencias'
)
ON CONFLICT (perfil_id, acceso_id) DO NOTHING;

-- EMPLEADO: funciones personales
INSERT INTO perfil_accesos (perfil_id, acceso_id)
SELECT p.id, a.id FROM perfiles p, accesos a
WHERE p.clave = 'EMPLEADO' AND a.clave IN (
    'registro-asistencia', 'solicitar-permiso', 'mis-permisos',
    'solicitar-vacaciones', 'mis-vacaciones',
    'registrar-incapacidad', 'mis-incapacidades'
)
ON CONFLICT (perfil_id, acceso_id) DO NOTHING;

-- ── Asignacion de perfiles a empleados existentes ────────────────
UPDATE empleados SET perfil_id = (SELECT id FROM perfiles WHERE clave = 'ADMIN'), estatus_usuario = 'activo'
WHERE numero_empleado = 'EMP002' AND perfil_id IS NULL;  -- Maria (Gerente RH)

UPDATE empleados SET perfil_id = (SELECT id FROM perfiles WHERE clave = 'RH'), estatus_usuario = 'activo'
WHERE numero_empleado IN ('EMP004') AND perfil_id IS NULL; -- Ana (Asistente Administrativa)

UPDATE empleados SET perfil_id = (SELECT id FROM perfiles WHERE clave = 'SUPERVISOR'), estatus_usuario = 'activo'
WHERE numero_empleado IN ('EMP005') AND perfil_id IS NULL; -- Luis (Coordinador IT)

UPDATE empleados SET perfil_id = (SELECT id FROM perfiles WHERE clave = 'EMPLEADO'), estatus_usuario = 'activo'
WHERE numero_empleado IN ('EMP001', 'EMP003') AND perfil_id IS NULL; -- Juan y Carlos