import { pool } from '../database/connection';
import {
    Vacante, Aspirante, Entrevista, PruebaAspirante, DocumentoAspirante,
    CreateVacanteDTO, CreateAspiranteDTO, CreateEntrevistaDTO,
    CreatePruebaDTO, AvanzarEtapaDTO
} from '../types/reclutamiento';

// Orden del pipeline de reclutamiento
const PIPELINE: Record<string, string> = {
    CAPTURA:      'CAPTURA',
    ENTREVISTA:   'ENTREVISTA',
    PRUEBAS:      'PRUEBAS',
    RESULTADOS:   'RESULTADOS',
    CONTRATACION: 'CONTRATACION',
};

export class ReclutamientoService {

    // ── VACANTES ─────────────────────────────────────────────

    async getAllVacantes(estatus?: string): Promise<Vacante[]> {
        let q = 'SELECT * FROM vacantes';
        const params: any[] = [];
        if (estatus) { q += ' WHERE estatus = $1'; params.push(estatus); }
        q += ' ORDER BY created_at DESC';
        return (await pool.query(q, params)).rows;
    }

    async getVacanteById(id: number): Promise<Vacante | null> {
        const r = await pool.query('SELECT * FROM vacantes WHERE id = $1', [id]);
        return r.rows[0] ?? null;
    }

    async createVacante(data: CreateVacanteDTO): Promise<Vacante> {
        const q = `
            INSERT INTO vacantes (titulo, departamento, descripcion, requisitos,
                salario_min, salario_max, num_plazas, modalidad, fecha_cierre, created_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *`;
        const r = await pool.query(q, [
            data.titulo, data.departamento, data.descripcion, data.requisitos,
            data.salario_min, data.salario_max, data.num_plazas ?? 1,
            data.modalidad ?? 'presencial', data.fecha_cierre, data.created_by
        ]);
        return r.rows[0];
    }

    async updateVacante(id: number, data: Partial<CreateVacanteDTO>): Promise<Vacante> {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;
        for (const [k, v] of Object.entries(data)) {
            if (v !== undefined) { fields.push(`${k} = $${i++}`); values.push(v); }
        }
        values.push(id);
        const r = await pool.query(
            `UPDATE vacantes SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            values
        );
        return r.rows[0];
    }

    async cambiarEstatusVacante(id: number, estatus: string): Promise<Vacante> {
        const r = await pool.query(
            'UPDATE vacantes SET estatus = $1 WHERE id = $2 RETURNING *',
            [estatus, id]
        );
        return r.rows[0];
    }

    async getEstadisticasVacantes(): Promise<any> {
        const r = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE estatus = 'activa')    AS activas,
                COUNT(*) FILTER (WHERE estatus = 'pausada')   AS pausadas,
                COUNT(*) FILTER (WHERE estatus = 'cerrada')   AS cerradas,
                COUNT(*) FILTER (WHERE estatus = 'cancelada') AS canceladas,
                COUNT(*)                                        AS total
            FROM vacantes`);
        return r.rows[0];
    }

    // ── ASPIRANTES ────────────────────────────────────────────

    async getAllAspirantes(filters?: { estatus?: string; etapa?: string; vacante_id?: number }): Promise<any[]> {
        let q = `
            SELECT a.*, v.titulo AS vacante_titulo
            FROM aspirantes a
            LEFT JOIN vacantes v ON a.vacante_id = v.id
            WHERE 1=1`;
        const params: any[] = [];
        let i = 1;
        if (filters?.estatus)    { q += ` AND a.estatus = $${i++}`;     params.push(filters.estatus); }
        if (filters?.etapa)      { q += ` AND a.etapa_actual = $${i++}`;params.push(filters.etapa); }
        if (filters?.vacante_id) { q += ` AND a.vacante_id = $${i++}`;  params.push(filters.vacante_id); }
        q += ' ORDER BY a.created_at DESC';
        return (await pool.query(q, params)).rows;
    }

    async getAspiranteById(id: number): Promise<any | null> {
        const r = await pool.query(`
            SELECT a.*, v.titulo AS vacante_titulo
            FROM aspirantes a
            LEFT JOIN vacantes v ON a.vacante_id = v.id
            WHERE a.id = $1`, [id]);
        return r.rows[0] ?? null;
    }

    async createAspirante(data: CreateAspiranteDTO): Promise<Aspirante> {
        const q = `
            INSERT INTO aspirantes (vacante_id, nombre, apellido_paterno, apellido_materno,
                email, telefono, fecha_nacimiento, fuente_reclutamiento,
                salario_pretendido, disponibilidad, notas)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *`;
        const r = await pool.query(q, [
            data.vacante_id, data.nombre, data.apellido_paterno, data.apellido_materno,
            data.email, data.telefono, data.fecha_nacimiento, data.fuente_reclutamiento,
            data.salario_pretendido, data.disponibilidad, data.notas
        ]);
        return r.rows[0];
    }

    async avanzarEtapa(data: AvanzarEtapaDTO): Promise<Aspirante> {
        const { aspirante_id, nueva_etapa, nuevo_estatus, motivo_rechazo, notas } = data;
        const r = await pool.query(`
            UPDATE aspirantes
            SET etapa_actual     = $1,
                estatus          = COALESCE($2, estatus),
                motivo_rechazo   = $3,
                notas            = COALESCE($4, notas)
            WHERE id = $5
            RETURNING *`,
            [nueva_etapa, nuevo_estatus, motivo_rechazo, notas, aspirante_id]
        );
        return r.rows[0];
    }

    async rechazarAspirante(id: number, motivo: string, notas?: string): Promise<Aspirante> {
        const r = await pool.query(`
            UPDATE aspirantes
            SET estatus = 'RECHAZADO', motivo_rechazo = $1, notas = COALESCE($2, notas)
            WHERE id = $3
            RETURNING *`,
            [motivo, notas, id]
        );
        return r.rows[0];
    }

    async aprobarAspirante(id: number): Promise<Aspirante> {
        const r = await pool.query(`
            UPDATE aspirantes
            SET estatus = 'APROBADO', etapa_actual = 'CONTRATACION'
            WHERE id = $1
            RETURNING *`, [id]
        );
        return r.rows[0];
    }

    async getEstadisticasAspirantes(vacanteId?: number): Promise<any> {
        let where = vacanteId ? `WHERE vacante_id = $1` : '';
        const params = vacanteId ? [vacanteId] : [];
        const r = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE estatus = 'REGISTRADO')  AS registrados,
                COUNT(*) FILTER (WHERE estatus = 'REVISION')    AS en_revision,
                COUNT(*) FILTER (WHERE estatus = 'ENTREVISTA')  AS en_entrevista,
                COUNT(*) FILTER (WHERE estatus = 'EVALUADO')    AS evaluados,
                COUNT(*) FILTER (WHERE estatus = 'APROBADO')    AS aprobados,
                COUNT(*) FILTER (WHERE estatus = 'RECHAZADO')   AS rechazados,
                COUNT(*)                                          AS total
            FROM aspirantes ${where}`, params);
        return r.rows[0];
    }

    // ── ENTREVISTAS ───────────────────────────────────────────

    async getEntrevistasByAspirante(aspiranteId: number): Promise<Entrevista[]> {
        const r = await pool.query(
            'SELECT * FROM entrevistas WHERE aspirante_id = $1 ORDER BY fecha_hora',
            [aspiranteId]
        );
        return r.rows;
    }

    async createEntrevista(data: CreateEntrevistaDTO): Promise<Entrevista> {
        const q = `
            INSERT INTO entrevistas (aspirante_id, entrevistador, tipo, fecha_hora, duracion_min, lugar_liga)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *`;
        const r = await pool.query(q, [
            data.aspirante_id, data.entrevistador, data.tipo,
            data.fecha_hora, data.duracion_min ?? 60, data.lugar_liga
        ]);
        // Avanzar aspirante a etapa entrevista
        await this.avanzarEtapa({
            aspirante_id: data.aspirante_id,
            nueva_etapa: 'ENTREVISTA',
            nuevo_estatus: 'ENTREVISTA'
        });
        return r.rows[0];
    }

    async registrarResultadoEntrevista(
        id: number,
        calificacion: number,
        comentarios: string,
        estatus: string
    ): Promise<Entrevista> {
        const r = await pool.query(`
            UPDATE entrevistas
            SET calificacion = $1, comentarios = $2, estatus = $3
            WHERE id = $4
            RETURNING *`,
            [calificacion, comentarios, estatus, id]
        );
        return r.rows[0];
    }

    // ── PRUEBAS ───────────────────────────────────────────────

    async getPruebasByAspirante(aspiranteId: number): Promise<PruebaAspirante[]> {
        const r = await pool.query(
            'SELECT * FROM pruebas_aspirante WHERE aspirante_id = $1 ORDER BY fecha_aplicacion',
            [aspiranteId]
        );
        return r.rows;
    }

    async createPrueba(data: CreatePruebaDTO): Promise<PruebaAspirante> {
        const q = `
            INSERT INTO pruebas_aspirante
                (aspirante_id, tipo_prueba, fecha_aplicacion, resultado, calificacion, observaciones, aplicada_por)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`;
        const r = await pool.query(q, [
            data.aspirante_id, data.tipo_prueba, data.fecha_aplicacion,
            data.resultado, data.calificacion, data.observaciones, data.aplicada_por
        ]);
        await this.avanzarEtapa({
            aspirante_id: data.aspirante_id,
            nueva_etapa: 'PRUEBAS',
            nuevo_estatus: 'EVALUADO'
        });
        return r.rows[0];
    }

    // ── DOCUMENTOS ────────────────────────────────────────────

    async getDocumentosByAspirante(aspiranteId: number): Promise<DocumentoAspirante[]> {
        const r = await pool.query(
            'SELECT * FROM documentos_aspirante WHERE aspirante_id = $1 ORDER BY tipo_documento',
            [aspiranteId]
        );
        return r.rows;
    }

    async registrarDocumento(
        aspiranteId: number,
        tipoDocumento: string,
        nombreArchivo?: string,
        archivoUrl?: string
    ): Promise<DocumentoAspirante> {
        const q = `
            INSERT INTO documentos_aspirante (aspirante_id, tipo_documento, nombre_archivo, archivo_url)
            VALUES ($1,$2,$3,$4)
            ON CONFLICT DO NOTHING
            RETURNING *`;
        const r = await pool.query(q, [aspiranteId, tipoDocumento, nombreArchivo, archivoUrl]);
        return r.rows[0];
    }

    async validarDocumento(id: number, estatus: 'validado' | 'rechazado', notas?: string): Promise<DocumentoAspirante> {
        const r = await pool.query(
            'UPDATE documentos_aspirante SET estatus = $1, notas = $2 WHERE id = $3 RETURNING *',
            [estatus, notas, id]
        );
        return r.rows[0];
    }

    // ── CATÁLOGOS DE RECLUTAMIENTO ────────────────────────────
    async getCatalogos(categoria: string): Promise<any[]> {
        const r = await pool.query(
            `SELECT clave, valor, descripcion FROM catalogos
             WHERE categoria = $1 AND activo = true
             ORDER BY orden, valor`,
            [categoria]
        );
        return r.rows;
    }

    async getAllCatalogosReclutamiento(): Promise<Record<string, any[]>> {
        const categorias = [
            'fuente_reclutamiento','estatus_aspirante','tipo_entrevista',
            'etapa_proceso','doc_aspirante','tipo_prueba','resultado_prueba','motivo_rechazo'
        ];
        const result: Record<string, any[]> = {};
        await Promise.all(
            categorias.map(async cat => {
                result[cat] = await this.getCatalogos(cat);
            })
        );
        return result;
    }

    // ── PIPELINE / KANBAN ─────────────────────────────────────
    async getPipeline(vacanteId?: number): Promise<Record<string, any[]>> {
        const etapas = Object.keys(PIPELINE);
        let where = vacanteId ? 'AND a.vacante_id = $1' : '';
        const params = vacanteId ? [vacanteId] : [];
        const r = await pool.query(`
            SELECT a.*, v.titulo AS vacante_titulo
            FROM aspirantes a
            LEFT JOIN vacantes v ON a.vacante_id = v.id
            WHERE a.estatus NOT IN ('RECHAZADO','CANCELADO')
            ${where}
            ORDER BY a.etapa_actual, a.updated_at DESC`, params);

        const pipeline: Record<string, any[]> = {};
        etapas.forEach(e => { pipeline[e] = []; });
        r.rows.forEach(row => {
            const etapa = row.etapa_actual in pipeline ? row.etapa_actual : 'CAPTURA';
            pipeline[etapa].push(row);
        });
        return pipeline;
    }
}

export default new ReclutamientoService();
