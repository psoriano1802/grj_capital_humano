import { pool } from '../database/connection';
import { Vacacion, CreateVacacionDTO } from '../types';

export class VacacionService {
    // Calcular días de vacaciones disponibles
    private calcularDiasDisponibles(fechaIngreso: Date, year: number): number {
        const ingreso = new Date(fechaIngreso);
        // Años completos de servicio cumplidos al inicio del año objetivo,
        // considerando el mes y día exactos de ingreso.
        const aniversarioAnio = new Date(year, ingreso.getMonth(), ingreso.getDate());
        let añosAntiguedad = year - ingreso.getFullYear();
        if (aniversarioAnio > new Date(year, 0, 1)) añosAntiguedad -= 1; // aún no cumple el año dentro del periodo
        if (añosAntiguedad < 0) añosAntiguedad = 0;

        // Tabla de días según antigüedad (Ley Federal del Trabajo México)
        if (añosAntiguedad < 1) return 0;
        if (añosAntiguedad === 1) return 12;
        if (añosAntiguedad === 2) return 14;
        if (añosAntiguedad === 3) return 16;
        if (añosAntiguedad === 4) return 18;
        if (añosAntiguedad <= 9) return 20;
        if (añosAntiguedad <= 14) return 22;
        if (añosAntiguedad <= 19) return 24;
        if (añosAntiguedad <= 24) return 26;
        if (añosAntiguedad <= 29) return 28;
        return 30;
    }

    // Inicializar vacaciones para un empleado
    async inicializarVacaciones(empleadoId: number, year: number): Promise<Vacacion> {
        // Obtener fecha de ingreso del empleado
        const empleadoQuery = 'SELECT fecha_ingreso FROM empleados WHERE id = $1';
        const empleadoResult = await pool.query(empleadoQuery, [empleadoId]);

        if (empleadoResult.rows.length === 0) {
            throw new Error('Empleado no encontrado');
        }

        const fechaIngreso = empleadoResult.rows[0].fecha_ingreso;
        const diasDisponibles = this.calcularDiasDisponibles(fechaIngreso, year);

        const query = `
      INSERT INTO vacaciones (
        empleado_id, periodo_year, dias_disponibles, dias_pendientes
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (empleado_id, periodo_year) DO NOTHING
      RETURNING *
    `;
        const result = await pool.query(query, [empleadoId, year, diasDisponibles, diasDisponibles]);
        return result.rows[0];
    }

    // Solicitar vacaciones
    async solicitarVacaciones(data: CreateVacacionDTO): Promise<Vacacion> {
        const { empleado_id, periodo_year, fecha_inicio, fecha_fin, dias_solicitados } = data;

        // Verificar días disponibles
        const checkQuery = `
      SELECT * FROM vacaciones 
      WHERE empleado_id = $1 AND periodo_year = $2
    `;
        const checkResult = await pool.query(checkQuery, [empleado_id, periodo_year]);

        if (checkResult.rows.length === 0) {
            // Inicializar vacaciones si no existen
            await this.inicializarVacaciones(empleado_id, periodo_year);
            const recheckResult = await pool.query(checkQuery, [empleado_id, periodo_year]);
            if (recheckResult.rows[0].dias_pendientes < dias_solicitados) {
                throw new Error('No hay suficientes días de vacaciones disponibles');
            }
        } else if (checkResult.rows[0].dias_pendientes < dias_solicitados) {
            throw new Error('No hay suficientes días de vacaciones disponibles');
        }

        const query = `
      UPDATE vacaciones 
      SET fecha_inicio = $1,
          fecha_fin = $2,
          dias_tomados = dias_tomados + $3,
          dias_pendientes = dias_pendientes - $3,
          estatus = 'pendiente'
      WHERE empleado_id = $4 AND periodo_year = $5
      RETURNING *
    `;
        const result = await pool.query(query, [
            fecha_inicio,
            fecha_fin,
            dias_solicitados,
            empleado_id,
            periodo_year
        ]);

        return result.rows[0];
    }

    // Aprobar vacaciones
    async aprobarVacaciones(vacacionId: number, aprobadoPor: number, comentarios?: string): Promise<Vacacion> {
        const current = await pool.query('SELECT estatus FROM vacaciones WHERE id = $1', [vacacionId]);
        if (current.rows.length === 0) throw new Error('Vacaciones no encontradas');
        if (current.rows[0].estatus !== 'pendiente') throw new Error('Solo se pueden aprobar solicitudes en estado pendiente');

        const query = `
      UPDATE vacaciones 
      SET estatus = 'aprobado',
          aprobado_por = $1,
          fecha_aprobacion = CURRENT_TIMESTAMP,
          comentarios = $2
      WHERE id = $3
      RETURNING *
    `;
        const result = await pool.query(query, [aprobadoPor, comentarios, vacacionId]);
        return result.rows[0];
    }

    // Rechazar vacaciones
    async rechazarVacaciones(vacacionId: number, aprobadoPor: number, comentarios: string): Promise<Vacacion> {
        // Primero obtener los días solicitados para devolverlos
        const getQuery = 'SELECT * FROM vacaciones WHERE id = $1';
        const getResult = await pool.query(getQuery, [vacacionId]);

        if (getResult.rows.length === 0) throw new Error('Vacaciones no encontradas');
        const vacacion = getResult.rows[0];
        if (vacacion.estatus !== 'pendiente') throw new Error('Solo se pueden rechazar solicitudes en estado pendiente');

        const diasDevolver = vacacion.dias_tomados;

        const query = `
      UPDATE vacaciones 
      SET estatus = 'rechazado',
          aprobado_por = $1,
          fecha_aprobacion = CURRENT_TIMESTAMP,
          comentarios = $2,
          dias_tomados = dias_tomados - $3,
          dias_pendientes = dias_pendientes + $3
      WHERE id = $4
      RETURNING *
    `;
        const result = await pool.query(query, [aprobadoPor, comentarios, diasDevolver, vacacionId]);
        return result.rows[0];
    }

    // Obtener vacaciones por empleado
    async getVacacionesByEmpleado(empleadoId: number): Promise<Vacacion[]> {
        const query = `
      SELECT v.*, e.nombre, e.apellido_paterno, e.apellido_materno
      FROM vacaciones v
      JOIN empleados e ON v.empleado_id = e.id
      WHERE v.empleado_id = $1
      ORDER BY v.periodo_year DESC
    `;
        const result = await pool.query(query, [empleadoId]);
        return result.rows;
    }

    // Obtener vacaciones pendientes
    async getVacacionesPendientes(): Promise<Vacacion[]> {
        const query = `
      SELECT v.*, e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado, e.departamento
      FROM vacaciones v
      JOIN empleados e ON v.empleado_id = e.id
      WHERE v.estatus = 'pendiente'
      ORDER BY v.created_at ASC
    `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Obtener balance de vacaciones
    async getBalanceVacaciones(empleadoId: number, year: number): Promise<any> {
        const query = `
      SELECT * FROM vacaciones 
      WHERE empleado_id = $1 AND periodo_year = $2
    `;
        const result = await pool.query(query, [empleadoId, year]);

        if (result.rows.length === 0) {
            // Inicializar si no existe
            return await this.inicializarVacaciones(empleadoId, year);
        }

        return result.rows[0];
    }

    // Reporte general de todas las solicitudes de vacaciones
    async getReporteVacaciones(): Promise<any[]> {
        const query = `
      SELECT v.*,
             e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado, e.departamento,
             a.nombre  AS aprobado_nombre,
             a.apellido_paterno AS aprobado_apellido
      FROM vacaciones v
      JOIN empleados e ON v.empleado_id = e.id
      LEFT JOIN empleados a ON a.id = v.aprobado_por
      ORDER BY v.created_at DESC, v.id DESC
    `;
        const result = await pool.query(query);
        return result.rows;
    }
}

export default new VacacionService();
