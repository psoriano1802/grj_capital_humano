import { pool } from '../database/connection';
import { Permiso, CreatePermisoDTO } from '../types';

interface PuestoResuelto {
    id: number;
    puesto_id: number | null;
    departamento_id: number | null;
    nivel_orden: number;
    es_admin: boolean;
}

export class PermisoService {
    // Crear solicitud de permiso
    async createPermiso(data: CreatePermisoDTO): Promise<Permiso> {
        const query = `
      INSERT INTO permisos (
        empleado_id, tipo_permiso, fecha_inicio, fecha_fin,
        horas_solicitadas, motivo
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const values = [
            data.empleado_id,
            data.tipo_permiso,
            data.fecha_inicio,
            data.fecha_fin,
            data.horas_solicitadas,
            data.motivo
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Obtener permisos por empleado
    async getPermisosByEmpleado(empleadoId: number): Promise<Permiso[]> {
        const query = `
      SELECT p.*, e.nombre, e.apellido_paterno, e.apellido_materno
      FROM permisos p
      JOIN empleados e ON p.empleado_id = e.id
      WHERE p.empleado_id = $1
      ORDER BY p.created_at DESC
    `;
        const result = await pool.query(query, [empleadoId]);
        return result.rows;
    }

    // Obtener todos los permisos pendientes (admin / sin filtro)
    async getPermisosPendientes(): Promise<Permiso[]> {
        const query = `
      SELECT p.*, e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado, e.departamento, e.puesto
      FROM permisos p
      JOIN empleados e ON p.empleado_id = e.id
      WHERE p.estatus = 'pendiente'
      ORDER BY p.created_at ASC
    `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Resolver el puesto/departamento/nivel de un empleado, con fallback por nombre de texto
    private async resolverPuestoEmpleado(empleadoId: number): Promise<PuestoResuelto | null> {
        const query = `
      SELECT
        e.id,
        COALESCE(e.puesto_id, p_match.id) AS puesto_id,
        COALESCE(e.departamento_id, d_match.id) AS departamento_id,
        COALESCE(np.orden, 0) AS nivel_orden,
        COALESCE(pf.es_administrador, false) AS es_admin
      FROM empleados e
      LEFT JOIN puestos p_match ON LOWER(TRIM(e.puesto)) = LOWER(TRIM(p_match.nombre)) AND p_match.activo
      LEFT JOIN departamentos d_match ON LOWER(TRIM(e.departamento)) = LOWER(TRIM(d_match.nombre)) AND d_match.activo
      LEFT JOIN puestos p ON p.id = COALESCE(e.puesto_id, p_match.id)
      LEFT JOIN niveles_puesto np ON np.clave = p.nivel_puesto
      LEFT JOIN perfiles pf ON pf.id = e.perfil_id
      WHERE e.id = $1
    `;
        const result = await pool.query(query, [empleadoId]);
        return result.rows[0] || null;
    }

    // Calcular los puestos que el aprobador puede supervisar:
    // - mismo departamento con nivel jerárquico inferior
    // - reportes directos o indirectos según el organigrama
    private async calcularPuestosSubordinados(aprobador: PuestoResuelto): Promise<Set<number>> {
        const subordinados = new Set<number>();
        if (!aprobador.puesto_id) return subordinados;

        // Mismo departamento, nivel inferior
        if (aprobador.departamento_id && aprobador.nivel_orden > 0) {
            const deptQuery = `
        SELECT p.id
        FROM puestos p
        JOIN niveles_puesto np ON np.clave = p.nivel_puesto
        WHERE p.departamento_id = $1 AND np.orden < $2 AND p.activo
      `;
            const deptResult = await pool.query(deptQuery, [aprobador.departamento_id, aprobador.nivel_orden]);
            deptResult.rows.forEach((row: { id: number }) => subordinados.add(row.id));
        }

        // Reportes en organigrama (directos e indirectos)
        const orgQuery = `
      WITH RECURSIVE sub AS (
        SELECT o.puesto_id FROM organigrama o WHERE o.puesto_jefe_id = $1 AND o.vigente
        UNION ALL
        SELECT o2.puesto_id
        FROM organigrama o2
        JOIN sub s ON o2.puesto_jefe_id = s.puesto_id
        WHERE o2.vigente
      )
      SELECT puesto_id FROM sub
    `;
        const orgResult = await pool.query(orgQuery, [aprobador.puesto_id]);
        orgResult.rows.forEach((row: { puesto_id: number }) => subordinados.add(row.puesto_id));

        return subordinados;
    }

    // Permisos pendientes visibles para un aprobador (jerarquía + admin override)
    async getPermisosPendientesParaAprobador(aprobadorId: number): Promise<Permiso[]> {
        const aprobador = await this.resolverPuestoEmpleado(aprobadorId);
        if (!aprobador) return [];

        if (aprobador.es_admin) {
            return this.getPermisosPendientes();
        }

        const subordinados = await this.calcularPuestosSubordinados(aprobador);
        if (subordinados.size === 0) return [];

        const query = `
      SELECT p.*, e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado,
             e.departamento, e.puesto
      FROM permisos p
      JOIN empleados e ON e.id = p.empleado_id
      LEFT JOIN puestos pu ON LOWER(TRIM(e.puesto)) = LOWER(TRIM(pu.nombre)) AND pu.activo
      WHERE p.estatus = 'pendiente'
        AND p.empleado_id != $1
        AND COALESCE(e.puesto_id, pu.id) = ANY($2::int[])
      ORDER BY p.created_at ASC
    `;
        const result = await pool.query(query, [aprobadorId, Array.from(subordinados)]);
        return result.rows;
    }

    // Verifica si un empleado puede aprobar/rechazar un permiso específico
    async puedeAprobarPermiso(permisoId: number, aprobadorId: number): Promise<boolean> {
        const aprobador = await this.resolverPuestoEmpleado(aprobadorId);
        if (!aprobador) return false;
        if (aprobador.es_admin) return true;

        const permisoResult = await pool.query('SELECT empleado_id FROM permisos WHERE id = $1', [permisoId]);
        if (permisoResult.rows.length === 0) return false;

        const solicitanteId = permisoResult.rows[0].empleado_id;
        if (solicitanteId === aprobadorId) return false;

        const subordinados = await this.calcularPuestosSubordinados(aprobador);
        if (subordinados.size === 0) return false;

        const solicitante = await this.resolverPuestoEmpleado(solicitanteId);
        if (!solicitante || !solicitante.puesto_id) return false;
        return subordinados.has(solicitante.puesto_id);
    }

    // Aprobar permiso
    async aprobarPermiso(permisoId: number, aprobadoPor: number, comentarios?: string): Promise<Permiso> {
        const query = `
      UPDATE permisos 
      SET estatus = 'aprobado',
          aprobado_por = $1,
          fecha_aprobacion = CURRENT_TIMESTAMP,
          comentarios_aprobacion = $2
      WHERE id = $3
      RETURNING *
    `;
        const result = await pool.query(query, [aprobadoPor, comentarios, permisoId]);
        return result.rows[0];
    }

    // Rechazar permiso
    async rechazarPermiso(permisoId: number, aprobadoPor: number, comentarios: string): Promise<Permiso> {
        const query = `
      UPDATE permisos 
      SET estatus = 'rechazado',
          aprobado_por = $1,
          fecha_aprobacion = CURRENT_TIMESTAMP,
          comentarios_aprobacion = $2
      WHERE id = $3
      RETURNING *
    `;
        const result = await pool.query(query, [aprobadoPor, comentarios, permisoId]);
        return result.rows[0];
    }

    // Obtener permisos por rango de fechas
    async getPermisosByFechas(fechaInicio: Date, fechaFin: Date): Promise<Permiso[]> {
        const query = `
      SELECT p.*, e.nombre, e.apellido_paterno, e.apellido_materno, e.numero_empleado
      FROM permisos p
      JOIN empleados e ON p.empleado_id = e.id
      WHERE p.fecha_inicio BETWEEN $1 AND $2
      ORDER BY p.fecha_inicio ASC
    `;
        const result = await pool.query(query, [fechaInicio, fechaFin]);
        return result.rows;
    }

    // Cancelar permiso
    async cancelarPermiso(permisoId: number): Promise<void> {
        const query = 'DELETE FROM permisos WHERE id = $1';
        await pool.query(query, [permisoId]);
    }

    // Obtener estadísticas de permisos
    async getEstadisticasPermisos(empleadoId?: number): Promise<any> {
        let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN estatus = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estatus = 'aprobado' THEN 1 END) as aprobados,
        COUNT(CASE WHEN estatus = 'rechazado' THEN 1 END) as rechazados,
        tipo_permiso,
        SUM(horas_solicitadas) as total_horas
      FROM permisos
    `;

        const params: any[] = [];
        if (empleadoId) {
            query += ' WHERE empleado_id = $1';
            params.push(empleadoId);
        }

        query += ' GROUP BY tipo_permiso';

        const result = await pool.query(query, params);
        return result.rows;
    }
}

export default new PermisoService();
