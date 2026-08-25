import { pool } from '../database/connection';
import {
    CreatePerfilDTO,
    UpdatePerfilDTO,
    CreateAccesoDTO,
    UpdateAccesoDTO,
    UpdateUsuarioSeguridadDTO,
} from '../types';

export class SeguridadService {
    // ── PERFILES ──────────────────────────────────────────────
    async getPerfiles(): Promise<any[]> {
        const result = await pool.query(`
      SELECT p.*,
             COUNT(pa.id)::int AS total_accesos
      FROM perfiles p
      LEFT JOIN perfil_accesos pa ON pa.perfil_id = p.id
      GROUP BY p.id
      ORDER BY p.nivel_jerarquico DESC, p.clave ASC
    `);
        return result.rows;
    }

    async getPerfil(id: number): Promise<any> {
        const result = await pool.query('SELECT * FROM perfiles WHERE id = $1', [id]);
        if (result.rows.length === 0) throw new Error('Perfil no encontrado');
        return result.rows[0];
    }

    async createPerfil(data: CreatePerfilDTO): Promise<any> {
        const {
            clave,
            nombre,
            descripcion = null,
            nivel_jerarquico = 0,
            es_administrador = false,
            estatus = 'activo',
        } = data;
        const result = await pool.query(
            `INSERT INTO perfiles (clave, nombre, descripcion, nivel_jerarquico, es_administrador, estatus)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [clave.trim().toUpperCase(), nombre, descripcion, nivel_jerarquico, es_administrador, estatus]
        );
        return result.rows[0];
    }

    async updatePerfil(id: number, data: UpdatePerfilDTO): Promise<any> {
        const existing = await this.getPerfil(id);
        const clave = data.clave?.trim().toUpperCase() ?? existing.clave;
        const nombre = data.nombre ?? existing.nombre;
        const descripcion = data.descripcion !== undefined ? data.descripcion : existing.descripcion;
        const nivel_jerarquico = data.nivel_jerarquico !== undefined ? data.nivel_jerarquico : existing.nivel_jerarquico;
        const es_administrador = data.es_administrador !== undefined ? data.es_administrador : existing.es_administrador;
        const estatus = data.estatus ?? existing.estatus;

        const result = await pool.query(
            `UPDATE perfiles SET clave = $1, nombre = $2, descripcion = $3,
             nivel_jerarquico = $4, es_administrador = $5, estatus = $6
             WHERE id = $7 RETURNING *`,
            [clave, nombre, descripcion, nivel_jerarquico, es_administrador, estatus, id]
        );
        return result.rows[0];
    }

    async deletePerfil(id: number): Promise<void> {
        const asignados = await pool.query(
            'SELECT COUNT(*)::int AS total FROM empleados WHERE perfil_id = $1',
            [id]
        );
        if (asignados.rows[0].total > 0) {
            throw new Error('No se puede eliminar un perfil asignado a empleados. Reasigna o desasigna los usuarios primero.');
        }
        const result = await pool.query('DELETE FROM perfiles WHERE id = $1', [id]);
        if (result.rowCount === 0) throw new Error('Perfil no encontrado');
    }

    // ── ACCESOS (modulos) ─────────────────────────────────────
    async getAccesos(): Promise<any[]> {
        const result = await pool.query(`
      SELECT a.*, COUNT(pa.id)::int AS total_perfiles
      FROM accesos a
      LEFT JOIN perfil_accesos pa ON pa.acceso_id = a.id
      GROUP BY a.id
      ORDER BY a.orden ASC, a.modulo ASC, a.nombre ASC
    `);
        return result.rows;
    }

    async getAcceso(id: number): Promise<any> {
        const result = await pool.query('SELECT * FROM accesos WHERE id = $1', [id]);
        if (result.rows.length === 0) throw new Error('Acceso no encontrado');
        return result.rows[0];
    }

    async createAcceso(data: CreateAccesoDTO): Promise<any> {
        const {
            clave,
            nombre,
            descripcion = null,
            modulo = null,
            icono = '📌',
            ruta = null,
            estatus = 'activo',
            orden = 0,
        } = data;
        const result = await pool.query(
            `INSERT INTO accesos (clave, nombre, descripcion, modulo, icono, ruta, estatus, orden)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [clave.trim(), nombre, descripcion, modulo, icono, ruta, estatus, orden]
        );
        return result.rows[0];
    }

    async updateAcceso(id: number, data: UpdateAccesoDTO): Promise<any> {
        const existing = await this.getAcceso(id);
        const updates: string[] = [];
        const values: any[] = [];
        const fields: (keyof UpdateAccesoDTO)[] = ['clave', 'nombre', 'descripcion', 'modulo', 'icono', 'ruta', 'estatus', 'orden'];

        for (const field of fields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = $${values.length + 1}`);
                values.push(data[field]);
            }
        }

        if (updates.length === 0) return existing;

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await pool.query(
            `UPDATE accesos SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async deleteAcceso(id: number): Promise<void> {
        const asignado = await pool.query(
            'SELECT COUNT(*)::int AS total FROM perfil_accesos WHERE acceso_id = $1',
            [id]
        );
        if (asignado.rows[0].total > 0) {
            throw new Error('No se puede eliminar un acceso asignado a perfiles. Desasigna el acceso primero.');
        }
        const result = await pool.query('DELETE FROM accesos WHERE id = $1', [id]);
        if (result.rowCount === 0) throw new Error('Acceso no encontrado');
    }

    // ── ASIGNACION DE ACCESOS A PERFIL ────────────────────────
    async getAccesosByPerfil(perfilId: number): Promise<any[]> {
        const result = await pool.query(`
      SELECT a.*, pa.id AS asignacion_id
      FROM accesos a
      LEFT JOIN perfil_accesos pa ON pa.acceso_id = a.id AND pa.perfil_id = $1
      ORDER BY a.orden ASC, a.modulo ASC, a.nombre ASC
    `, [perfilId]);
        return result.rows;
    }

    async setAccesosPerfil(perfilId: number, accesoIds: number[]): Promise<void> {
        await this.getPerfil(perfilId);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM perfil_accesos WHERE perfil_id = $1', [perfilId]);
            for (const accesoId of accesoIds) {
                await client.query(
                    'INSERT INTO perfil_accesos (perfil_id, acceso_id) VALUES ($1, $2) ON CONFLICT (perfil_id, acceso_id) DO NOTHING',
                    [perfilId, accesoId]
                );
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ── USUARIOS (empleados con perfil) ───────────────────────
    async getUsuarios(): Promise<any[]> {
        const result = await pool.query(`
      SELECT e.id, e.numero_empleado, e.nombre, e.apellido_paterno, e.apellido_materno,
             e.email, e.departamento, e.puesto, e.estatus,
             e.estatus_usuario, e.perfil_id,
             p.clave AS perfil_clave, p.nombre AS perfil_nombre,
             p.es_administrador AS perfil_admin,
             u.id AS usuario_id, u.username, u.rol
      FROM empleados e
      LEFT JOIN perfiles p ON p.id = e.perfil_id
      LEFT JOIN usuarios u ON u.empleado_id = e.id
      ORDER BY e.perfil_id NULLS LAST, e.nombre ASC
    `);
        return result.rows;
    }

    async updateUsuario(empleadoId: number, data: UpdateUsuarioSeguridadDTO): Promise<any> {
        const current = await pool.query(
            'SELECT perfil_id, estatus_usuario FROM empleados WHERE id = $1',
            [empleadoId]
        );
        if (current.rows.length === 0) throw new Error('Empleado no encontrado');

        const perfil_id = data.perfil_id !== undefined ? data.perfil_id : current.rows[0].perfil_id;
        const estatus_usuario = data.estatus_usuario ?? current.rows[0].estatus_usuario;

        // Validar estatus permitido
        const validos = ['activo', 'inactivo', 'temporalmente_inactivo'];
        if (!validos.includes(estatus_usuario)) {
            throw new Error(`Estatus de usuario inválido. Valores permitidos: ${validos.join(', ')}`);
        }

        const result = await pool.query(
            'UPDATE empleados SET perfil_id = $1, estatus_usuario = $2 WHERE id = $3 RETURNING id, perfil_id, estatus_usuario',
            [perfil_id, estatus_usuario, empleadoId]
        );
        return result.rows[0];
    }

    // ── ACCESOS POR USUARIO (para filtrado del menu) ──────────
    async getAccesosByEmpleado(empleadoId: number): Promise<any> {
        const emp = await pool.query(
            `SELECT e.id, e.perfil_id, e.estatus_usuario,
                    p.es_administrador AS perfil_admin
             FROM empleados e
             LEFT JOIN perfiles p ON p.id = e.perfil_id
             WHERE e.id = $1`,
            [empleadoId]
        );
        if (emp.rows.length === 0) throw new Error('Empleado no encontrado');
        const { perfil_id, estatus_usuario, perfil_admin } = emp.rows[0];

        // Administrador y usuarios sin perfil ven todo
        let accesos: any[];
        if (perfil_admin || !perfil_id) {
            const result = await pool.query(`SELECT clave, nombre FROM accesos WHERE estatus = 'activo' ORDER BY orden ASC`);
            accesos = result.rows;
        } else {
            const result = await pool.query(`
      SELECT a.clave, a.nombre, a.ruta
      FROM perfil_accesos pa
      JOIN accesos a ON a.id = pa.acceso_id AND a.estatus = 'activo'
      WHERE pa.perfil_id = $1
      ORDER BY a.orden ASC, a.nombre ASC
    `, [perfil_id]);
            accesos = result.rows;
        }

        return {
            estatus_usuario,
            perfil_id,
            es_administrador: perfil_admin || false,
            accesos,
        };
    }
}

export default new SeguridadService();