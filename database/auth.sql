-- Database: rh_management
-- Description: Autenticación - usuarios, invitaciones, recuperación de contraseña

SET client_encoding = 'UTF8';

-- ── Limpiar tabla legacy (sin email, sin password_hash real) ──
DROP TABLE IF EXISTS reset_codigos CASCADE;
DROP TABLE IF EXISTS sesiones CASCADE;
DROP TABLE IF EXISTS reset_password_tokens CASCADE;
DROP TABLE IF EXISTS invitaciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ── Tabla de Usuarios (credenciales de acceso) ─────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL UNIQUE REFERENCES empleados(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT false,
    must_change_password BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Invitaciones (registro controlado) ──────────────────────────
CREATE TABLE IF NOT EXISTS invitaciones (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT false,
    usado_en TIMESTAMP,
    created_by INTEGER REFERENCES empleados(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Tokens de recuperación por correo ──────────────────────────
CREATE TABLE IF NOT EXISTS reset_password_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT false,
    usado_en TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Códigos de recuperación generados por admin ─────────────────
CREATE TABLE IF NOT EXISTS reset_codigos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT false,
    usado_en TIMESTAMP,
    created_by INTEGER REFERENCES empleados(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Registro de sesiones (para logout global opcional) ──────────
CREATE TABLE IF NOT EXISTS sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_empleado ON usuarios(empleado_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_token ON invitaciones(token);
CREATE INDEX IF NOT EXISTS idx_invitaciones_email ON invitaciones(email);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON reset_password_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_email ON reset_password_tokens(email);
CREATE INDEX IF NOT EXISTS idx_reset_codigos_codigo ON reset_codigos(codigo);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token_hash);

-- Triggers de updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
