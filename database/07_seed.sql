-- Script para insertar datos de prueba en el sistema RH

-- Insertar empleados de prueba
INSERT INTO empleados (numero_empleado, nombre, apellido_paterno, apellido_materno, email, telefono, fecha_nacimiento, fecha_ingreso, puesto, departamento, salario) VALUES
('EMP001', 'Juan', 'García', 'López', 'juan.garcia@empresa.com', '5551234567', '1990-05-15', '2020-01-10', 'Desarrollador Senior', 'IT', 45000.00),
('EMP002', 'María', 'Rodríguez', 'Martínez', 'maria.rodriguez@empresa.com', '5551234568', '1988-08-22', '2019-03-15', 'Gerente de RH', 'RRHH', 55000.00),
('EMP003', 'Carlos', 'Hernández', 'Sánchez', 'carlos.hernandez@empresa.com', '5551234569', '1992-11-30', '2021-06-01', 'Analista de Ventas', 'VENTAS', 35000.00),
('EMP004', 'Ana', 'Martínez', 'González', 'ana.martinez@empresa.com', '5551234570', '1995-03-12', '2022-02-20', 'Asistente Administrativa', 'ADMIN', 28000.00),
('EMP005', 'Luis', 'López', 'Pérez', 'luis.lopez@empresa.com', '5551234571', '1987-07-08', '2018-09-10', 'Coordinador de IT', 'IT', 48000.00);

-- Insertar usuarios para los empleados
INSERT INTO usuarios (empleado_id, username, password_hash, rol) VALUES
(1, 'juan.garcia', '$2b$10$YourHashedPasswordHere1', 'empleado'),
(2, 'maria.rodriguez', '$2b$10$YourHashedPasswordHere2', 'rh'),
(3, 'carlos.hernandez', '$2b$10$YourHashedPasswordHere3', 'empleado'),
(4, 'ana.martinez', '$2b$10$YourHashedPasswordHere4', 'empleado'),
(5, 'luis.lopez', '$2b$10$YourHashedPasswordHere5', 'supervisor');

-- Insertar algunas asistencias de ejemplo
INSERT INTO asistencias (empleado_id, fecha, hora_entrada, hora_salida, tipo_registro, estatus) VALUES
(1, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + TIME '08:55:00', CURRENT_DATE - INTERVAL '1 day' + TIME '18:10:00', 'faceid', 'presente'),
(2, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + TIME '09:05:00', CURRENT_DATE - INTERVAL '1 day' + TIME '18:00:00', 'huella', 'tarde'),
(3, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + TIME '08:50:00', CURRENT_DATE - INTERVAL '1 day' + TIME '18:15:00', 'faceid', 'presente'),
(1, CURRENT_DATE, CURRENT_DATE + TIME '09:00:00', NULL, 'faceid', 'presente'),
(2, CURRENT_DATE, CURRENT_DATE + TIME '08:58:00', NULL, 'huella', 'presente');

-- Insertar permisos de ejemplo
INSERT INTO permisos (empleado_id, tipo_permiso, fecha_inicio, fecha_fin, horas_solicitadas, motivo, estatus) VALUES
(1, 'MEDICO', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days', 4, 'Cita médica de rutina', 'pendiente'),
(3, 'PERSONAL', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 8, 'Trámites personales', 'pendiente'),
(4, 'FAMILIAR', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '2 days', 4, 'Asunto familiar urgente', 'aprobado');

-- Insertar vacaciones de ejemplo
INSERT INTO vacaciones (empleado_id, periodo_year, dias_disponibles, dias_tomados, dias_pendientes, estatus) VALUES
(1, 2024, 12, 0, 12, 'pendiente'),
(2, 2024, 14, 5, 9, 'pendiente'),
(3, 2024, 16, 3, 13, 'pendiente'),
(4, 2024, 14, 0, 14, 'pendiente'),
(5, 2024, 20, 8, 12, 'pendiente');

-- Insertar una solicitud de vacaciones
UPDATE vacaciones 
SET fecha_inicio = CURRENT_DATE + INTERVAL '30 days',
    fecha_fin = CURRENT_DATE + INTERVAL '37 days',
    dias_tomados = 7,
    dias_pendientes = dias_disponibles - 7,
    estatus = 'pendiente'
WHERE empleado_id = 1 AND periodo_year = 2024;

-- Insertar incapacidad de ejemplo
INSERT INTO incapacidades (empleado_id, tipo_incapacidad, fecha_inicio, fecha_fin, dias_totales, folio_incapacidad, institucion, diagnostico, estatus) VALUES
(3, 'ENFERMEDAD', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '3 days', 3, 'IMSS-2024-001234', 'IMSS', 'Gripe estacional', 'finalizada');

-- Verificar datos insertados
SELECT 'Empleados insertados:' as info, COUNT(*) as total FROM empleados
UNION ALL
SELECT 'Usuarios insertados:', COUNT(*) FROM usuarios
UNION ALL
SELECT 'Asistencias insertadas:', COUNT(*) FROM asistencias
UNION ALL
SELECT 'Permisos insertados:', COUNT(*) FROM permisos
UNION ALL
SELECT 'Vacaciones inicializadas:', COUNT(*) FROM vacaciones
UNION ALL
SELECT 'Incapacidades insertadas:', COUNT(*) FROM incapacidades;
