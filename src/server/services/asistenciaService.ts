import { pool } from '../database/connection';
import { Asistencia, BiometricAuthDTO, RegistrarAsistenciaDTO } from '../types';
import crypto from 'crypto';
import faceRecognitionEngine, { FaceMatch } from './faceRecognitionService';

export class AsistenciaService {
    private async verifyBiometric(empleadoId: number, tipo: 'faceid' | 'huella', datos: string): Promise<boolean> {
        // Face ID: verificación real contra el motor de reconocimiento configurado
        if (tipo === 'faceid') {
            return faceRecognitionEngine.isFaceMatch(empleadoId, datos);
        }

        // 'huella': sin hardware todavía, se mantiene la simulación previa
        const query = `
      SELECT datos_biometricos FROM biometricos 
      WHERE empleado_id = $1 AND tipo = $2 AND activo = true
    `;
        const result = await pool.query(query, [empleadoId, tipo]);

        if (result.rows.length === 0) {
            return false;
        }

        const storedHash = result.rows[0].datos_biometricos;
        const providedHash = crypto.createHash('sha256').update(datos).digest('hex');

        return storedHash === providedHash;
    }

    // Identifica al empleado por su descriptor facial (sin escribir número de empleado)
    private async resolveFaceMatch(datos: string): Promise<FaceMatch> {
        return faceRecognitionEngine.identify(datos);
    }

    private async validarBiometricos(empleadoId: number | null | undefined, tipoRegistro: string, datos: string | undefined): Promise<number> {
        if (!datos) return empleadoId ?? 0;

        if (tipoRegistro === 'faceid') {
            // Verificación 1:1 contra el empleado seleccionado/sesión
            if (empleadoId !== null && empleadoId !== undefined) {
                const ok = await faceRecognitionEngine.isFaceMatch(empleadoId, datos);
                if (!ok) {
                    throw new Error('El rostro no corresponde al empleado de la sesión');
                }
                return empleadoId;
            }
            // Identificación: resolver quién es a partir del descriptor
            const match = await this.resolveFaceMatch(datos);
            if (!match.sujeto) {
                throw new Error('No se pudo identificar un rostro válido');
            }
            return parseInt(match.sujeto, 10);
        }

        if (tipoRegistro !== 'manual' && empleadoId) {
            const isValid = await this.verifyBiometric(empleadoId, tipoRegistro as 'faceid' | 'huella', datos);
            if (!isValid) {
                throw new Error('Datos biométricos no válidos');
            }
        }
        return empleadoId ?? 0;
    }

    // Registrar entrada
    async registrarEntrada(data: RegistrarAsistenciaDTO): Promise<Asistencia> {
        const { tipo_registro, datos_biometricos } = data;
        const fecha = new Date();
        fecha.setHours(0, 0, 0, 0);

        // Verificar biométricos si es necesario (resuelve el empleado si viene por rostro)
        const empleado_id = await this.validarBiometricos(data.empleado_id, tipo_registro, datos_biometricos);
        if (!empleado_id) {
            throw new Error('empleado_id es requerido');
        }

        // Verificar si ya existe registro para hoy
        const checkQuery = `
      SELECT * FROM asistencias 
      WHERE empleado_id = $1 AND fecha = $2
    `;
        const existing = await pool.query(checkQuery, [empleado_id, fecha]);

        if (existing.rows.length > 0) {
            throw new Error('Ya existe un registro de entrada para hoy');
        }

        // Determinar estatus (presente o tarde)
        const horaEntrada = new Date();
        const horaLimite = new Date();
        horaLimite.setHours(9, 10, 0, 0); // 9:10 AM con tolerancia

        const estatus = horaEntrada <= horaLimite ? 'presente' : 'tarde';

        const query = `
      INSERT INTO asistencias (
        empleado_id, fecha, hora_entrada, tipo_registro, estatus
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const result = await pool.query(query, [
            empleado_id,
            fecha,
            horaEntrada,
            tipo_registro,
            estatus
        ]);

        return result.rows[0];
    }

    // Registrar salida
    async registrarSalida(data: RegistrarAsistenciaDTO): Promise<Asistencia> {
        const { tipo_registro, datos_biometricos } = data;
        const fecha = new Date();
        fecha.setHours(0, 0, 0, 0);

        // Verificar biométricos si es necesario (resuelve el empleado si viene por rostro)
        const empleado_id = await this.validarBiometricos(data.empleado_id, tipo_registro, datos_biometricos);
        if (!empleado_id) {
            throw new Error('empleado_id es requerido');
        }

        // Buscar registro de entrada
        const checkQuery = `
      SELECT * FROM asistencias 
      WHERE empleado_id = $1 AND fecha = $2
    `;
        const existing = await pool.query(checkQuery, [empleado_id, fecha]);

        if (existing.rows.length === 0) {
            throw new Error('No existe registro de entrada para hoy');
        }

        if (existing.rows[0].hora_salida) {
            throw new Error('Ya existe un registro de salida para hoy');
        }

        const query = `
      UPDATE asistencias 
      SET hora_salida = $1
      WHERE empleado_id = $2 AND fecha = $3
      RETURNING *
    `;
        const result = await pool.query(query, [new Date(), empleado_id, fecha]);

        return result.rows[0];
    }

    // Marcar entrada/salida de forma unificada: si no hay registro hoy => entrada;
    // si hay entrada sin salida => salida; si ya está completo => error.
    async registrarMarcacion(data: RegistrarAsistenciaDTO): Promise<{ asistencia: Asistencia; accion: 'entrada' | 'salida' }> {
        const { tipo_registro, datos_biometricos } = data;
        const fecha = new Date();
        fecha.setHours(0, 0, 0, 0);

        const empleado_id = await this.validarBiometricos(data.empleado_id, tipo_registro, datos_biometricos);
        if (!empleado_id) {
            throw new Error('empleado_id es requerido');
        }

        const checkQuery = `SELECT * FROM asistencias WHERE empleado_id = $1 AND fecha = $2`;
        const existing = await pool.query(checkQuery, [empleado_id, fecha]);

        // Sin registro del día -> entrada
        if (existing.rows.length === 0) {
            const horaLimite = new Date();
            horaLimite.setHours(9, 10, 0, 0);
            const estatus = new Date() <= horaLimite ? 'presente' : 'tarde';

            const query = `
        INSERT INTO asistencias (empleado_id, fecha, hora_entrada, tipo_registro, estatus)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
            const result = await pool.query(query, [empleado_id, fecha, new Date(), tipo_registro, estatus]);
            return { asistencia: result.rows[0], accion: 'entrada' };
        }

        const reg = existing.rows[0];
        // Ya existe entrada -> salida
        if (!reg.hora_salida) {
            const query = `
        UPDATE asistencias SET hora_salida = $1
        WHERE empleado_id = $2 AND fecha = $3
        RETURNING *
      `;
            const result = await pool.query(query, [new Date(), empleado_id, fecha]);
            return { asistencia: result.rows[0], accion: 'salida' };
        }

        throw new Error('Ya registraste entrada y salida hoy');
    }

    // Obtener asistencias por empleado
    async getAsistenciasByEmpleado(empleadoId: number, fechaInicio?: Date, fechaFin?: Date): Promise<Asistencia[]> {
        let query = 'SELECT * FROM asistencias WHERE empleado_id = $1';
        const params: any[] = [empleadoId];

        if (fechaInicio && fechaFin) {
            query += ' AND fecha BETWEEN $2 AND $3';
            params.push(fechaInicio, fechaFin);
        }

        query += ' ORDER BY fecha DESC';
        const result = await pool.query(query, params);
        return result.rows;
    }

    // Obtener asistencias del día
    async getAsistenciasDelDia(fecha?: Date): Promise<Asistencia[]> {
        const targetDate = fecha || new Date();
        targetDate.setHours(0, 0, 0, 0);

        const query = `
      SELECT a.*, e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado
      FROM asistencias a
      JOIN empleados e ON a.empleado_id = e.id
      WHERE a.fecha = $1
      ORDER BY a.hora_entrada DESC
    `;
        const result = await pool.query(query, [targetDate]);
        return result.rows;
    }

    // Obtener todas las asistencias (para el reporte)
    async getTodasLasAsistencias(): Promise<any[]> {
        const query = `
      SELECT a.*, e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado
      FROM asistencias a
      JOIN empleados e ON a.empleado_id = e.id
      ORDER BY a.fecha DESC, a.hora_entrada DESC
    `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Rostros enrolados para Face ID
    async getRostrosEnrolados(): Promise<any[]> {
        const query = `
      SELECT b.empleado_id, b.activo, b.fecha_registro,
             e.numero_empleado, e.nombre, e.apellido_paterno, e.apellido_materno
      FROM biometricos b
      JOIN empleados e ON e.id = b.empleado_id
      WHERE b.tipo = 'faceid'
      ORDER BY e.apellido_paterno, e.nombre
    `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Activar / desactivar un rostro enrolado
    async setRostroEstado(empleadoId: number, activo: boolean): Promise<void> {
        await pool.query(
            `UPDATE biometricos SET activo = $1 WHERE empleado_id = $2 AND tipo = 'faceid'`,
            [activo, empleadoId]
        );
    }

    // Registrar datos biométricos
    async registrarBiometrico(data: BiometricAuthDTO): Promise<void> {
        const { empleado_id, tipo, datos_biometricos } = data;

        if (tipo === 'faceid') {
            // Enrolar el rostro ante el motor seleccionado (guarda el embedding).
            await faceRecognitionEngine.enroll(empleado_id, datos_biometricos);
            return;
        }

        // 'huella': se mantiene el hash previo
        const hash = crypto.createHash('sha256').update(datos_biometricos).digest('hex');

        const query = `
      INSERT INTO biometricos (empleado_id, tipo, datos_biometricos)
      VALUES ($1, $2, $3)
      ON CONFLICT (empleado_id, tipo) 
      DO UPDATE SET datos_biometricos = $3, fecha_registro = CURRENT_TIMESTAMP
    `;
        await pool.query(query, [empleado_id, tipo, hash]);
    }

    // Obtener reporte de asistencias
    async getReporteAsistencias(fechaInicio: Date, fechaFin: Date): Promise<any[]> {
        const query = `
      SELECT 
        e.id,
        e.numero_empleado,
        e.nombre,
        e.apellido_paterno,
        e.apellido_materno,
        e.departamento,
        COUNT(CASE WHEN a.estatus = 'presente' THEN 1 END) as dias_presente,
        COUNT(CASE WHEN a.estatus = 'tarde' THEN 1 END) as dias_tarde,
        COUNT(CASE WHEN a.estatus = 'falta' THEN 1 END) as faltas,
        COUNT(CASE WHEN a.estatus = 'justificado' THEN 1 END) as justificados
      FROM empleados e
      LEFT JOIN asistencias a ON e.id = a.empleado_id 
        AND a.fecha BETWEEN $1 AND $2
      WHERE e.estatus = 'activo'
      GROUP BY e.id, e.numero_empleado, e.nombre, e.apellido_paterno, e.apellido_materno, e.departamento
      ORDER BY e.apellido_paterno, e.nombre
    `;
        const result = await pool.query(query, [fechaInicio, fechaFin]);
        return result.rows;
    }
}

export default new AsistenciaService();
