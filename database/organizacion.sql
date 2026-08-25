-- ============================================================
-- MÓDULO: ORGANIZACIÓN
-- Catalogo de estructura organizacional
-- ============================================================
SET client_encoding = 'UTF8';

-- ── SUCURSALES / CENTROS DE TRABAJO ─────────────────────────
CREATE TABLE IF NOT EXISTS sucursales (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(20)  UNIQUE NOT NULL,
    nombre          VARCHAR(120) NOT NULL,
    tipo            VARCHAR(30)  NOT NULL DEFAULT 'SUCURSAL', -- MATRIZ, SUCURSAL, PLANTA, TIENDA, ALMACEN
    direccion       TEXT,
    ciudad          VARCHAR(80),
    estado          VARCHAR(80),
    codigo_postal   VARCHAR(10),
    telefono        VARCHAR(20),
    responsable     VARCHAR(120),
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DEPARTAMENTOS / ÁREAS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS departamentos (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(20)  UNIQUE NOT NULL,
    nombre          VARCHAR(120) NOT NULL,
    descripcion     TEXT,
    sucursal_id     INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,
    padre_id        INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
    responsable     VARCHAR(120),
    cc_costo        VARCHAR(30),  -- referencia al centro de costo
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PUESTOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS puestos (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(20)  UNIQUE NOT NULL,
    nombre          VARCHAR(120) NOT NULL,
    descripcion     TEXT,
    nivel_puesto    VARCHAR(40),  -- Operativo, Administrativo, Supervisión, Jefatura, Gerencia, Dirección
    departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
    salario_min     NUMERIC(12,2),
    salario_max     NUMERIC(12,2),
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NIVELES DE PUESTO ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS niveles_puesto (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(20)  UNIQUE NOT NULL,
    nombre          VARCHAR(80)  NOT NULL,
    descripcion     TEXT,
    orden           INTEGER NOT NULL DEFAULT 0,  -- para ordenar jerárquicamente
    activo          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── CENTROS DE COSTO ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS centros_costo (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(30)  UNIQUE NOT NULL,
    nombre          VARCHAR(120) NOT NULL,
    descripcion     TEXT,
    sucursal_id     INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,
    departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ORGANIGRAMA / RELACIÓN JERÁRQUICA ─────────────────────
CREATE TABLE IF NOT EXISTS organigrama (
    id              SERIAL PRIMARY KEY,
    puesto_id       INTEGER NOT NULL REFERENCES puestos(id) ON DELETE CASCADE,
    puesto_jefe_id  INTEGER REFERENCES puestos(id) ON DELETE SET NULL,
    departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
    nivel_jerarquico INTEGER NOT NULL DEFAULT 1,  -- 1=más alto
    es_jefe_directo BOOLEAN NOT NULL DEFAULT TRUE,
    vigente         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── UBICACIONES FÍSICAS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ubicaciones_fisicas (
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(20)  UNIQUE NOT NULL,
    nombre          VARCHAR(120) NOT NULL,
    tipo            VARCHAR(40)  NOT NULL DEFAULT 'OFICINA', -- OFICINA, PLANTA, ALMACEN, HOME_OFFICE, SALA_REUNION
    sucursal_id     INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,
    piso            VARCHAR(10),
    descripcion     TEXT,
    capacidad       INTEGER,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DATOS SEMILLA ──────────────────────────────────────────

-- Niveles de puesto
INSERT INTO niveles_puesto (clave, nombre, descripcion, orden) VALUES
  ('OPERATIVO',       'Operativo',       'Personal de línea o producción',              1),
  ('ADMINISTRATIVO',  'Administrativo',  'Soporte y administración general',             2),
  ('COORDINACION',    'Coordinación',    'Coordinación de equipos o procesos',           3),
  ('SUPERVISION',     'Supervisión',     'Supervisión directa de personal operativo',    4),
  ('JEFATURA',        'Jefatura',        'Jefe de área o departamento',                  5),
  ('GERENCIA',        'Gerencia',        'Gerente de área o sucursal',                   6),
  ('DIRECCION',       'Dirección',       'Director de área o división',                  7),
  ('DIRECCION_GRAL',  'Dirección General','Máximo nivel ejecutivo',                      8)
ON CONFLICT (clave) DO NOTHING;

-- Sucursales de ejemplo
INSERT INTO sucursales (clave, nombre, tipo, ciudad, estado, responsable) VALUES
  ('MATRIZ',    'Matriz Principal',     'MATRIZ',    'Ciudad de México', 'CDMX',         'Director General'),
  ('PLANTA1',   'Planta 1',             'PLANTA',    'Querétaro',        'Querétaro',     'Gerente de Planta'),
  ('TIENDA_N',  'Tienda Norte',         'TIENDA',    'Monterrey',        'Nuevo León',    'Gerente de Tienda'),
  ('TIENDA_S',  'Tienda Sur',           'TIENDA',    'Guadalajara',      'Jalisco',       'Gerente de Tienda')
ON CONFLICT (clave) DO NOTHING;

-- Departamentos principales
INSERT INTO departamentos (clave, nombre, descripcion, sucursal_id, responsable, cc_costo) VALUES
  ('RH',         'Recursos Humanos',    'Gestión del capital humano',                   1, 'Gerente RH',        'CC100'),
  ('VENTAS',     'Ventas',              'Fuerza de ventas y comercial',                 1, 'Gerente Ventas',    'CC200'),
  ('OPERACIONES','Operaciones',         'Operaciones y logística',                      1, 'Gerente Ops',       'CC300'),
  ('FINANZAS',   'Finanzas',            'Contabilidad y finanzas',                      1, 'Gerente Finanzas',  'CC400'),
  ('TI',         'Tecnologías de la Información', 'Infraestructura y sistemas',         1, 'Gerente TI',        'CC500'),
  ('PRODUCCION', 'Producción',          'Fabricación y control de calidad',             2, 'Jefe Producción',   'CC600')
ON CONFLICT (clave) DO NOTHING;

-- Centros de costo
INSERT INTO centros_costo (clave, nombre, descripcion, sucursal_id) VALUES
  ('CC100', 'CC100 - Recursos Humanos',  'Gastos del área de RH',         1),
  ('CC200', 'CC200 - Ventas',            'Gastos de ventas y comisiones',  1),
  ('CC300', 'CC300 - Operaciones',       'Costos operativos y logística',  1),
  ('CC400', 'CC400 - Finanzas',          'Gastos financieros y contables', 1),
  ('CC500', 'CC500 - TI',                'Infraestructura tecnológica',    1),
  ('CC600', 'CC600 - Producción',        'Costos de fabricación',          2)
ON CONFLICT (clave) DO NOTHING;

-- Puestos
INSERT INTO puestos (clave, nombre, nivel_puesto, departamento_id, salario_min, salario_max) VALUES
  ('AUX_RH',      'Auxiliar de RH',           'OPERATIVO',       1,  8000,  12000),
  ('ANALISTA_RH', 'Analista de RH',            'ADMINISTRATIVO',  1, 12000,  18000),
  ('COORD_RH',    'Coordinador de RH',         'COORDINACION',    1, 18000,  25000),
  ('GTE_RH',      'Gerente de RH',             'GERENCIA',        1, 30000,  50000),
  ('EJECUTIVO_V', 'Ejecutivo de Ventas',        'OPERATIVO',       2, 10000,  20000),
  ('COORD_V',     'Coordinador de Ventas',      'COORDINACION',    2, 20000,  30000),
  ('GTE_V',       'Gerente de Ventas',          'GERENCIA',        2, 35000,  60000),
  ('OPERARIO',    'Operario de Producción',     'OPERATIVO',       6,  7000,  10000),
  ('SUP_PROD',    'Supervisor de Producción',   'SUPERVISION',     6, 15000,  22000),
  ('ANALISTA_TI', 'Analista de TI',             'ADMINISTRATIVO',  5, 15000,  25000),
  ('GTE_TI',      'Gerente de TI',              'GERENCIA',        5, 35000,  60000),
  ('DIR_GRAL',    'Director General',            'DIRECCION_GRAL',  NULL, 80000, 150000)
ON CONFLICT (clave) DO NOTHING;

-- Ubicaciones físicas
INSERT INTO ubicaciones_fisicas (clave, nombre, tipo, sucursal_id, piso, capacidad) VALUES
  ('OF_RH',       'Oficina Recursos Humanos',  'OFICINA',       1, '2',  10),
  ('OF_VENTAS',   'Oficina Ventas',             'OFICINA',       1, '1',  20),
  ('PLANTA_PROD', 'Planta de Producción',       'PLANTA',        2, 'PB', 100),
  ('ALMACEN_1',   'Almacén Principal',           'ALMACEN',       2, 'PB', 200),
  ('SALA_CONF',   'Sala de Conferencias A',      'SALA_REUNION',  1, '3',  15),
  ('HOME_OFFICE', 'Home Office',                 'HOME_OFFICE',   NULL, NULL, NULL)
ON CONFLICT (clave) DO NOTHING;
