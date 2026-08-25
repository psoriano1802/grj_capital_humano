-- ============================================================
-- MÓDULO DE RECLUTAMIENTO
-- Tablas, catálogos e índices
-- ============================================================

SET client_encoding = 'UTF8';

-- ─── CATÁLOGOS DE RECLUTAMIENTO ────────────────────────────

-- 1. Fuentes de reclutamiento
INSERT INTO catalogos (categoria, clave, valor, descripcion, orden) VALUES
    ('fuente_reclutamiento', 'BOLSA',      'Bolsa de trabajo',  'Portales de empleo en línea',              1),
    ('fuente_reclutamiento', 'REFERIDO',   'Referido',          'Candidato referido por un empleado',       2),
    ('fuente_reclutamiento', 'REDES',      'Redes sociales',    'LinkedIn, Facebook, etc.',                 3),
    ('fuente_reclutamiento', 'UNIVERSIDAD','Universidad',       'Ferias universitarias o convenios',        4),
    ('fuente_reclutamiento', 'FERIA',      'Feria de empleo',   'Evento presencial de reclutamiento',       5)
ON CONFLICT (categoria, clave) DO NOTHING;

-- 2. Estatus del aspirante
INSERT INTO catalogos (categoria, clave, valor, descripcion, orden) VALUES
    ('estatus_aspirante', 'REGISTRADO',   'Registrado',             'Candidato recién registrado',                  1),
    ('estatus_aspirante', 'REVISION',     'En revisión',            'CV en revisión por RH',                        2),
    ('estatus_aspirante', 'ENTREVISTA',   'Entrevista programada',  'Entrevista agendada',                          3),
    ('estatus_aspirante', 'EVALUADO',     'Evaluado',               'Pruebas aplicadas, pendiente de resultado',    4),
    ('estatus_aspirante', 'APROBADO',     'Aprobado',               'Candidato aprobado para contratación',         5),
    ('estatus_aspirante', 'RECHAZADO',    'Rechazado',              'Candidato no cumple el perfil',                6),
    ('estatus_aspirante', 'CANCELADO',    'Cancelado',              'Proceso cancelado',                            7)
ON CONFLICT (categoria, clave) DO NOTHING;

-- 3. Tipos de entrevista
INSERT INTO catalogos (categoria, clave, valor, descripcion, orden) VALUES
    ('tipo_entrevista', 'PRESENCIAL', 'Presencial', 'Entrevista cara a cara en oficinas',    1),
    ('tipo_entrevista', 'VIRTUAL',    'Virtual',    'Videoconferencia (Zoom, Teams, etc.)',  2),
    ('tipo_entrevista', 'TELEFONICA', 'Telefónica', 'Entrevista por llamada telefónica',     3)
ON CONFLICT (categoria, clave) DO NOTHING;

-- 4. Etapas del proceso
INSERT INTO catalogos (categoria, clave, valor, descripcion, orden) VALUES
    ('etapa_proceso', 'CAPTURA',      'Captura',       'Registro inicial del candidato',  1),
    ('etapa_proceso', 'ENTREVISTA',   'Entrevista',    'Entrevista con RH o gerente',     2),
    ('etapa_proceso', 'PRUEBAS',      'Pruebas',       'Aplicación de evaluaciones',      3),
    ('etapa_proceso', 'RESULTADOS',   'Resultados',    'Revisión de resultados',          4),
    ('etapa_proceso', 'CONTRATACION', 'Contratación',  'Proceso de alta formal',          5)
ON CONFLICT (categoria, clave) DO NOTHING;

-- 5. Tipos de documentos del aspirante
INSERT INTO catalogos (categoria, clave, valor, descripcion, orden) VALUES
    ('doc_aspirante', 'CV',         'CV',                        'Currículum Vitae',                   1),
    ('doc_aspirante', 'ID',         'Identificación',            'INE / Pasaporte',                    2),
    ('doc_aspirante', 'DOMICILIO',  'Comprobante de domicilio',  'Recibo de luz, agua, etc.',           3),
    ('doc_aspirante', 'CONSTANCIAS','Constancias',               'Constancias de estudios o laborales', 4),
    ('doc_aspirante', 'REFERENCIAS','Referencias',               'Cartas de recomendación',             5)
ON CONFLICT (categoria, clave) DO NOTHING;

-- 6. Tipos de pruebas
INSERT INTO catalogos (categoria, clave, valor, descripcion, orden) VALUES
    ('tipo_prueba', 'PSICOMETRICA',  'Psicométrica',   'Evaluación de personalidad y aptitudes',   1),
    ('tipo_prueba', 'TECNICA',       'Técnica',        'Prueba de conocimientos del área',         2),
    ('tipo_prueba', 'MEDICA',        'Médica',         'Examen médico de ingreso',                 3),
    ('tipo_prueba', 'CONOCIMIENTOS', 'Conocimientos',  'Examen general de conocimientos',          4),
    ('tipo_prueba', 'PERSONALIDAD',  'Personalidad',   'Test de personalidad (DISC, MBTI, etc.)',  5)
ON CONFLICT (categoria, clave) DO NOTHING;

-- 7. Resultado de pruebas
INSERT INTO catalogos (categoria, clave, valor, descripcion, orden) VALUES
    ('resultado_prueba', 'APROBADO',      'Aprobado',      'Candidato aprobó la evaluación',              1),
    ('resultado_prueba', 'CONDICIONADO',  'Condicionado',  'Aprobado con observaciones o pendientes',     2),
    ('resultado_prueba', 'NO_APROBADO',   'No aprobado',   'Candidato no aprobó la evaluación',           3)
ON CONFLICT (categoria, clave) DO NOTHING;

-- 8. Motivos de rechazo o cancelación
INSERT INTO catalogos (categoria, clave, valor, descripcion, orden) VALUES
    ('motivo_rechazo', 'NO_PERFIL',    'No cumple perfil',          'El candidato no cumple con los requisitos del puesto', 1),
    ('motivo_rechazo', 'NO_PRESENTO',  'No se presentó',            'El candidato no se presentó a la entrevista/prueba',   2),
    ('motivo_rechazo', 'EXPECTATIVA',  'Expectativa salarial',      'La expectativa económica no es compatible',            3),
    ('motivo_rechazo', 'DOC_INCOMPLETA','Documentación incompleta', 'El candidato no entregó la documentación requerida',   4),
    ('motivo_rechazo', 'CANCELADO_EMP','Cancelado por empresa',     'La empresa canceló el proceso de reclutamiento',       5)
ON CONFLICT (categoria, clave) DO NOTHING;


-- ─── TABLA: VACANTES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vacantes (
    id               SERIAL PRIMARY KEY,
    titulo           VARCHAR(150) NOT NULL,
    departamento     VARCHAR(100),
    descripcion      TEXT,
    requisitos       TEXT,
    salario_min      DECIMAL(10,2),
    salario_max      DECIMAL(10,2),
    num_plazas       INTEGER DEFAULT 1,
    modalidad        VARCHAR(30) DEFAULT 'presencial',   -- 'presencial','remoto','hibrido'
    estatus          VARCHAR(30) DEFAULT 'activa',       -- 'activa','pausada','cerrada','cancelada'
    fecha_apertura   DATE DEFAULT CURRENT_DATE,
    fecha_cierre     DATE,
    created_by       INTEGER REFERENCES empleados(id),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABLA: ASPIRANTES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS aspirantes (
    id                    SERIAL PRIMARY KEY,
    vacante_id            INTEGER REFERENCES vacantes(id) ON DELETE SET NULL,
    nombre                VARCHAR(100) NOT NULL,
    apellido_paterno      VARCHAR(100) NOT NULL,
    apellido_materno      VARCHAR(100),
    email                 VARCHAR(150) NOT NULL,
    telefono              VARCHAR(20),
    fecha_nacimiento      DATE,
    fuente_reclutamiento  VARCHAR(50),   -- cat: fuente_reclutamiento
    cv_url                VARCHAR(255),
    foto_url              VARCHAR(255),
    etapa_actual          VARCHAR(50) DEFAULT 'CAPTURA',   -- cat: etapa_proceso
    estatus               VARCHAR(50) DEFAULT 'REGISTRADO', -- cat: estatus_aspirante
    salario_pretendido    DECIMAL(10,2),
    disponibilidad        VARCHAR(50),
    notas                 TEXT,
    motivo_rechazo        VARCHAR(50),   -- cat: motivo_rechazo
    empleado_id           INTEGER REFERENCES empleados(id) ON DELETE SET NULL, -- empleado creado al contratar
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABLA: ENTREVISTAS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS entrevistas (
    id              SERIAL PRIMARY KEY,
    aspirante_id    INTEGER REFERENCES aspirantes(id) ON DELETE CASCADE,
    entrevistador   VARCHAR(150),
    tipo            VARCHAR(30) NOT NULL,    -- cat: tipo_entrevista
    fecha_hora      TIMESTAMP NOT NULL,
    duracion_min    INTEGER DEFAULT 60,
    lugar_liga      VARCHAR(255),            -- Sala física o link de videollamada
    estatus         VARCHAR(30) DEFAULT 'programada', -- 'programada','realizada','cancelada','no_presentado'
    calificacion    DECIMAL(4,2),            -- 0-10
    comentarios     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABLA: PRUEBAS APLICADAS ───────────────────────────────
CREATE TABLE IF NOT EXISTS pruebas_aspirante (
    id              SERIAL PRIMARY KEY,
    aspirante_id    INTEGER REFERENCES aspirantes(id) ON DELETE CASCADE,
    tipo_prueba     VARCHAR(50) NOT NULL,    -- cat: tipo_prueba
    fecha_aplicacion DATE NOT NULL,
    resultado       VARCHAR(50),            -- cat: resultado_prueba
    calificacion    DECIMAL(5,2),
    observaciones   TEXT,
    archivo_url     VARCHAR(255),
    aplicada_por    VARCHAR(150),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABLA: DOCUMENTOS DEL ASPIRANTE ────────────────────────
CREATE TABLE IF NOT EXISTS documentos_aspirante (
    id              SERIAL PRIMARY KEY,
    aspirante_id    INTEGER REFERENCES aspirantes(id) ON DELETE CASCADE,
    tipo_documento  VARCHAR(50) NOT NULL,   -- cat: doc_aspirante
    nombre_archivo  VARCHAR(255),
    archivo_url     VARCHAR(255),
    estatus         VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente','recibido','validado','rechazado'
    notas           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── ÍNDICES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_aspirantes_estatus    ON aspirantes(estatus);
CREATE INDEX IF NOT EXISTS idx_aspirantes_vacante    ON aspirantes(vacante_id);
CREATE INDEX IF NOT EXISTS idx_aspirantes_etapa      ON aspirantes(etapa_actual);
CREATE INDEX IF NOT EXISTS idx_entrevistas_aspirante ON entrevistas(aspirante_id);
CREATE INDEX IF NOT EXISTS idx_pruebas_aspirante     ON pruebas_aspirante(aspirante_id);
CREATE INDEX IF NOT EXISTS idx_vacantes_estatus      ON vacantes(estatus);

-- ─── TRIGGERS ───────────────────────────────────────────────
DROP TRIGGER IF EXISTS update_vacantes_updated_at ON vacantes;
CREATE TRIGGER update_vacantes_updated_at
    BEFORE UPDATE ON vacantes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aspirantes_updated_at ON aspirantes;
CREATE TRIGGER update_aspirantes_updated_at
    BEFORE UPDATE ON aspirantes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entrevistas_updated_at ON entrevistas;
CREATE TRIGGER update_entrevistas_updated_at
    BEFORE UPDATE ON entrevistas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Columna idempotente: empleado creado al contratar un aspirante
ALTER TABLE aspirantes ADD COLUMN IF NOT EXISTS empleado_id INTEGER REFERENCES empleados(id) ON DELETE SET NULL;
