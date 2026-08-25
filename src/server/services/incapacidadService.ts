import { pool } from '../database/connection';
import { Incapacidad, CreateIncapacidadDTO } from '../types';

export class IncapacidadService {
    // Calcular días entre dos fechas
    private calcularDias(fechaInicio: Date, fechaFin: Date): number {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    private async validarEmpleadoExiste(empleadoId: number) {
        const result = await pool.query('SELECT id FROM empleados WHERE id = $1', [empleadoId]);
        if (result.rowCount === 0) {
            throw new Error(`No existe un empleado con id ${empleadoId}. Primero registra al empleado.`);
        }
    }

    // Crear incapacidad
    async createIncapacidad(data: CreateIncapacidadDTO): Promise<Incapacidad> {
        await this.validarEmpleadoExiste(data.empleado_id);

        const diasTotales = this.calcularDias(new Date(data.fecha_inicio), new Date(data.fecha_fin));

        const query = `
      INSERT INTO incapacidades (
        empleado_id, tipo_incapacidad, fecha_inicio, fecha_fin,
        dias_totales, folio_incapacidad, institucion, diagnostico
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
        const values = [
            data.empleado_id,
            data.tipo_incapacidad,
            data.fecha_inicio,
            data.fecha_fin,
            diasTotales,
            data.folio_incapacidad,
            data.institucion,
            data.diagnostico
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Obtener incapacidades por empleado
    async getIncapacidadesByEmpleado(empleadoId: number): Promise<Incapacidad[]> {
        const query = `
      SELECT i.*, e.nombre, e.apellido_paterno, e.apellido_materno
      FROM incapacidades i
      JOIN empleados e ON i.empleado_id = e.id
      WHERE i.empleado_id = $1
      ORDER BY i.fecha_inicio DESC
    `;
        const result = await pool.query(query, [empleadoId]);
        return result.rows;
    }

    // Obtener todas las incapacidades activas
    async getIncapacidadesActivas(): Promise<Incapacidad[]> {
        const query = `
      SELECT i.*, e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado, e.departamento
      FROM incapacidades i
      JOIN empleados e ON i.empleado_id = e.id
      WHERE i.estatus = 'activa'
      ORDER BY i.fecha_inicio DESC
    `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Finalizar incapacidad
    async finalizarIncapacidad(incapacidadId: number): Promise<Incapacidad> {
        const query = `
      UPDATE incapacidades 
      SET estatus = 'finalizada'
      WHERE id = $1
      RETURNING *
    `;
        const result = await pool.query(query, [incapacidadId]);
        return result.rows[0];
    }

    // Cancelar incapacidad
    async cancelarIncapacidad(incapacidadId: number): Promise<Incapacidad> {
        const query = `
      UPDATE incapacidades 
      SET estatus = 'cancelada'
      WHERE id = $1
      RETURNING *
    `;
        const result = await pool.query(query, [incapacidadId]);
        return result.rows[0];
    }

    // Obtener incapacidades por rango de fechas
    async getIncapacidadesByFechas(fechaInicio: Date, fechaFin: Date): Promise<Incapacidad[]> {
        const query = `
      SELECT i.*, e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado
      FROM incapacidades i
      JOIN empleados e ON i.empleado_id = e.id
      WHERE i.fecha_inicio BETWEEN $1 AND $2
      ORDER BY i.fecha_inicio DESC
    `;
        const result = await pool.query(query, [fechaInicio, fechaFin]);
        return result.rows;
    }

    // Obtener estadísticas de incapacidades
    async getEstadisticasIncapacidades(empleadoId?: number): Promise<any> {
        let query = `
      SELECT 
        COUNT(*) as total,
        SUM(dias_totales) as total_dias,
        tipo_incapacidad,
        COUNT(CASE WHEN estatus = 'activa' THEN 1 END) as activas,
        COUNT(CASE WHEN estatus = 'finalizada' THEN 1 END) as finalizadas
      FROM incapacidades
    `;

        const params: any[] = [];
        if (empleadoId) {
            query += ' WHERE empleado_id = $1';
            params.push(empleadoId);
        }

        query += ' GROUP BY tipo_incapacidad';

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Actualizar incapacidad
    async updateIncapacidad(incapacidadId: number, data: Partial<CreateIncapacidadDTO>): Promise<Incapacidad> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });

        // Recalcular días si se actualizan las fechas
        if (data.fecha_inicio && data.fecha_fin) {
            const diasTotales = this.calcularDias(new Date(data.fecha_inicio), new Date(data.fecha_fin));
            fields.push(`dias_totales = $${paramCount}`);
            values.push(diasTotales);
            paramCount++;
        }

        values.push(incapacidadId);
        const query = `
      UPDATE incapacidades 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await pool.query(query, values);
        return result.rows[0];
    }
}

export default new IncapacidadService();
