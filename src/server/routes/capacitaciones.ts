import { Router, Request, Response } from 'express';
import pool from '../database/connection';

const router = Router();
const q = (sql: string, params?: any[]) => pool.query(sql, params);

// ═══════════════════════════════════════════════════════════════
// CAPACITACIONES (catálogo)
// ═══════════════════════════════════════════════════════════════

router.get('/', async (_req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT c.*,
                (SELECT COUNT(*) FROM capacitacion_inscripciones ci WHERE ci.capacitacion_id = c.id)::int AS total_inscritos
            FROM capacitaciones c
            WHERE c.estatus != 'cancelada'
            ORDER BY c.fecha_inicio DESC
        `);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/:id', async (req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT c.*,
                (SELECT COUNT(*) FROM capacitacion_inscripciones ci WHERE ci.capacitacion_id = c.id)::int AS total_inscritos
            FROM capacitaciones c WHERE c.id = $1
        `, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ success: false, error: 'No encontrada' });
        res.json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            titulo, descripcion, tipo, proveedor,
            fecha_inicio, fecha_fin, duracion_horas, costo,
            capacidad, modalidad, archivo_material, archivo_certificado,
            archivo_base64, estatus
        } = req.body;
        const { rows } = await q(`
            INSERT INTO capacitaciones
                (titulo, descripcion, tipo, proveedor, fecha_inicio, fecha_fin,
                 duracion_horas, costo, capacidad, modalidad, archivo_material,
                 archivo_certificado, archivo_base64, estatus)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
        `, [titulo, descripcion, tipo || 'interna', proveedor,
            fecha_inicio, fecha_fin, duracion_horas, costo || 0,
            capacidad || 0, modalidad || 'presencial', archivo_material,
            archivo_certificado, archivo_base64, estatus || 'activa']);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const {
            titulo, descripcion, tipo, proveedor,
            fecha_inicio, fecha_fin, duracion_horas, costo,
            capacidad, modalidad, archivo_material, archivo_certificado,
            archivo_base64, estatus
        } = req.body;
        const { rows } = await q(`
            UPDATE capacitaciones SET
                titulo=$1, descripcion=$2, tipo=$3, proveedor=$4,
                fecha_inicio=$5, fecha_fin=$6, duracion_horas=$7, costo=$8,
                capacidad=$9, modalidad=$10, archivo_material=$11,
                archivo_certificado=$12, archivo_base64=$13, estatus=$14,
                updated_at=NOW()
            WHERE id=$15 RETURNING *
        `, [titulo, descripcion, tipo, proveedor, fecha_inicio, fecha_fin,
            duracion_horas, costo, capacidad, modalidad, archivo_material,
            archivo_certificado, archivo_base64, estatus, req.params.id]);
        res.json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res: Response) => {
    try {
        await q(`UPDATE capacitaciones SET estatus='cancelada', updated_at=NOW() WHERE id=$1`, [req.params.id]);
        res.json({ success: true, message: 'Capacitación cancelada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// SESIONES / ASISTENTES
// ═══════════════════════════════════════════════════════════════

router.get('/:id/sesiones', async (req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT * FROM capacitacion_asistentes
            WHERE capacitacion_id = $1 ORDER BY fecha_sesion
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/:id/sesiones', async (req: Request, res: Response) => {
    try {
        const { fecha_sesion, hora_inicio, hora_fin, lugar, instructor, temas, duracion_horas } = req.body;
        const { rows } = await q(`
            INSERT INTO capacitacion_asistentes
                (capacitacion_id, fecha_sesion, hora_inicio, hora_fin, lugar, instructor, temas, duracion_horas)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
        `, [req.params.id, fecha_sesion, hora_inicio, hora_fin, lugar, instructor, temas, duracion_horas || 0]);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/sesiones/:sid', async (req: Request, res: Response) => {
    try {
        const { fecha_sesion, hora_inicio, hora_fin, lugar, instructor, temas, duracion_horas } = req.body;
        const { rows } = await q(`
            UPDATE capacitacion_asistentes SET
                fecha_sesion=$1, hora_inicio=$2, hora_fin=$3, lugar=$4,
                instructor=$5, temas=$6, duracion_horas=$7
            WHERE id=$8 RETURNING *
        `, [fecha_sesion, hora_inicio, hora_fin, lugar, instructor, temas, duracion_horas, req.params.sid]);
        res.json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/sesiones/:sid', async (req, res: Response) => {
    try {
        await q(`DELETE FROM capacitacion_asistentes WHERE id=$1`, [req.params.sid]);
        res.json({ success: true, message: 'Sesión eliminada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// INSCRIPCIONES
// ═══════════════════════════════════════════════════════════════

router.get('/:id/inscripciones', async (req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT ci.*,
                e.numero_empleado, e.nombre, e.apellido_paterno, e.apellido_materno,
                e.puesto, e.departamento,
                (SELECT COUNT(*) FROM capacitacion_asistencia_sesion cas
                 WHERE cas.inscripcion_id = ci.id AND cas.presente = true)::int AS sesiones_asistidas,
                (SELECT COUNT(*) FROM capacitacion_asistentes ca
                 WHERE ca.capacitacion_id = ci.capacitacion_id)::int AS total_sesiones
            FROM capacitacion_inscripciones ci
            JOIN empleados e ON e.id = ci.empleado_id
            WHERE ci.capacitacion_id = $1
            ORDER BY e.nombre
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/:id/inscribir', async (req: Request, res: Response) => {
    try {
        const { empleado_ids } = req.body;
        if (!empleado_ids || !Array.isArray(empleado_ids)) {
            return res.status(400).json({ success: false, error: 'empleado_ids debe ser un arreglo' });
        }
        const resultados = [];
        for (const empId of empleado_ids) {
            const { rows } = await q(`
                INSERT INTO capacitacion_inscripciones (capacitacion_id, empleado_id)
                VALUES ($1,$2)
                ON CONFLICT (capacitacion_id, empleado_id) DO NOTHING
                RETURNING *
            `, [req.params.id, empId]);
            if (rows[0]) resultados.push(rows[0]);
        }
        res.status(201).json({ success: true, data: resultados, message: `${resultados.length} inscription(s) created` });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/inscripciones/:iid', async (req: Request, res: Response) => {
    try {
        const { calificacion, horas_completadas, estatus, observaciones, archivo_entrega, fecha_completado } = req.body;
        const { rows } = await q(`
            UPDATE capacitacion_inscripciones SET
                calificacion=$1, horas_completadas=$2, estatus=$3,
                observaciones=$4, archivo_entrega=$5, fecha_completado=$6,
                updated_at=NOW()
            WHERE id=$7 RETURNING *
        `, [calificacion, horas_completadas, estatus, observaciones, archivo_entrega, fecha_completado, req.params.iid]);
        res.json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/inscripciones/:iid', async (req, res: Response) => {
    try {
        await q(`DELETE FROM capacitacion_inscripciones WHERE id=$1`, [req.params.iid]);
        res.json({ success: true, message: 'Inscripción eliminada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// ASISTENCIA POR SESIÓN
// ═══════════════════════════════════════════════════════════════

router.get('/sesiones/:sid/asistencia', async (req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT cas.*, ci.empleado_id, e.numero_empleado, e.nombre, e.apellido_paterno
            FROM capacitacion_asistencia_sesion cas
            JOIN capacitacion_inscripciones ci ON ci.id = cas.inscripcion_id
            JOIN empleados e ON e.id = ci.empleado_id
            WHERE cas.sesion_id = $1
        `, [req.params.sid]);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/sesiones/:sid/asistencia', async (req: Request, res: Response) => {
    try {
        const { inscripcion_ids, presente } = req.body;
        const resultados = [];
        for (const insId of inscripcion_ids) {
            const { rows } = await q(`
                INSERT INTO capacitacion_asistencia_sesion (inscripcion_id, sesion_id, presente)
                VALUES ($1,$2,$3)
                ON CONFLICT (inscripcion_id, sesion_id) DO UPDATE SET presente=$3
                RETURNING *
            `, [insId, req.params.sid, presente]);
            resultados.push(rows[0]);
        }
        res.json({ success: true, data: resultados });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// INSCRIPCIONES DE UN EMPLEADO
// ═══════════════════════════════════════════════════════════════

router.get('/empleado/:eid', async (req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT ci.*, c.titulo, c.fecha_inicio, c.fecha_fin,
                c.duracion_horas, c.modalidad, c.tipo,
                (SELECT COUNT(*) FROM capacitacion_asistencia_sesion cas
                 JOIN capacitacion_inscripciones ci2 ON ci2.id = cas.inscripcion_id
                 WHERE ci2.capacitacion_id = c.id AND ci2.empleado_id = $1 AND cas.presente = true)::int AS sesiones_asistidas,
                (SELECT COUNT(*) FROM capacitacion_asistentes ca WHERE ca.capacitacion_id = c.id)::int AS total_sesiones,
                (SELECT folio FROM capacitacion_certificados cc WHERE cc.inscripcion_id = ci.id LIMIT 1) AS certificado_folio
            FROM capacitacion_inscripciones ci
            JOIN capacitaciones c ON c.id = ci.capacitacion_id
            WHERE ci.empleado_id = $1
            ORDER BY c.fecha_inicio DESC
        `, [req.params.eid]);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// CERTIFICADOS
// ═══════════════════════════════════════════════════════════════

router.get('/certificados/:iid', async (req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT cc.*, ci.empleado_id, ci.capacitacion_id,
                e.numero_empleado, e.nombre, e.apellido_paterno, e.apellido_materno,
                c.titulo AS capacitacion_titulo, c.duracion_horas
            FROM capacitacion_certificados cc
            JOIN capacitacion_inscripciones ci ON ci.id = cc.inscripcion_id
            JOIN empleados e ON e.id = ci.empleado_id
            JOIN capacitaciones c ON c.id = ci.capacitacion_id
            WHERE cc.inscripcion_id = $1
        `, [req.params.iid]);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/certificados/:iid/generar', async (req: Request, res: Response) => {
    try {
        const { tipo } = req.body;
        const validTypes = ['participacion', 'culminacion', 'aprovechamiento', 'asistencia'];
        if (!validTypes.includes(tipo)) {
            return res.status(400).json({ success: false, error: 'Tipo de certificado inválido' });
        }

        // Verificar condiciones
        const { rows: insRows } = await q(`
            SELECT ci.*, c.fecha_fin, c.duracion_horas,
                (SELECT COUNT(*) FROM capacitacion_asistencia_sesion cas
                 WHERE cas.inscripcion_id = ci.id AND cas.presente = true)::int AS sesiones_asistidas,
                (SELECT COUNT(*) FROM capacitacion_asistentes ca
                 WHERE ca.capacitacion_id = ci.capacitacion_id)::int AS total_sesiones
            FROM capacitacion_inscripciones ci
            JOIN capacitaciones c ON c.id = ci.capacitacion_id
            WHERE ci.id = $1
        `, [req.params.iid]);

        if (!insRows[0]) return res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
        const ins = insRows[0];

        // Reglas de generación
        const asistenciaPct = ins.total_sesiones > 0 ? (ins.sesiones_asistidas / ins.total_sesiones) * 100 : 0;

        if (tipo === 'participacion' && asistenciaPct < 80) {
            return res.status(400).json({ success: false, error: 'Requiere 80% de asistencia mínima para constancia de participación' });
        }
        if (tipo === 'asistencia' && asistenciaPct < 100) {
            return res.status(400).json({ success: false, error: 'Requiere 100% de asistencia para constancia de asistencia' });
        }
        if (tipo === 'culminacion' && ins.estatus !== 'completado') {
            return res.status(400).json({ success: false, error: 'Inscripción debe estar completada' });
        }
        if (tipo === 'aprovechamiento' && (ins.calificacion === null || Number(ins.calificacion) < 90)) {
            return res.status(400).json({ success: false, error: 'Requiere calificación mínima de 90 para constancia de aprovechamiento' });
        }

        // Generar folio único
        const folio = `CERT-${new Date().getFullYear()}-${String(req.params.iid).padStart(5, '0')}-${tipo.substring(0, 3).toUpperCase()}`;

        const { rows } = await q(`
            INSERT INTO capacitacion_certificados (inscripcion_id, folio, tipo)
            VALUES ($1, $2, $3) RETURNING *
        `, [req.params.iid, folio, tipo]);

        // Notificación
        await q(`
            INSERT INTO capacitacion_notificaciones
                (inscripcion_id, tipo, mensaje)
            VALUES ($1, 'certificado_disponible', $2)
        `, [req.params.iid, `Tu certificado de ${tipo} está disponible para descarga.`]);

        res.status(201).json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// REPORTES
// ═══════════════════════════════════════════════════════════════

router.get('/reportes/resumen', async (_req, res: Response) => {
    try {
        const { rows: totalCap } = await q(`SELECT COUNT(*)::int AS total FROM capacitaciones WHERE estatus = 'activa'`);
        const { rows: totalIns } = await q(`SELECT COUNT(*)::int AS total FROM capacitacion_inscripciones`);
        const { rows: completados } = await q(`SELECT COUNT(*)::int AS total FROM capacitacion_inscripciones WHERE estatus = 'completado'`);
        const { rows: costoTotal } = await q(`SELECT COALESCE(SUM(costo), 0)::decimal AS total FROM capacitaciones WHERE estatus = 'activa'`);

        const { rows: porModalidad } = await q(`
            SELECT modalidad, COUNT(*)::int AS total FROM capacitaciones
            WHERE estatus = 'activa' GROUP BY modalidad
        `);

        const { rows: porDepartamento } = await q(`
            SELECT e.departamento, COUNT(DISTINCT ci.empleado_id)::int AS empleados_capacitados,
                COUNT(ci.id)::int AS inscripciones
            FROM capacitacion_inscripciones ci
            JOIN empleados e ON e.id = ci.empleado_id
            JOIN capacitaciones c ON c.id = ci.capacitacion_id
            WHERE c.estatus = 'activa'
            GROUP BY e.departamento ORDER BY empleados_capacitados DESC
        `);

        res.json({
            success: true,
            data: {
                total_capacitaciones: totalCap[0]?.total || 0,
                total_inscripciones: totalIns[0]?.total || 0,
                completados: completados[0]?.total || 0,
                costo_total: costoTotal[0]?.total || 0,
                por_modalidad: porModalidad,
                por_departamento: porDepartamento
            }
        });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/reportes/empleado/:eid', async (req, res: Response) => {
    try {
        const { rows: hrs } = await q(`
            SELECT
                COUNT(*)::int AS cursos_totales,
                SUM(CASE WHEN ci.estatus = 'completado' THEN 1 ELSE 0 END)::int AS cursos_completados,
                COALESCE(SUM(ci.horas_completadas), 0)::decimal AS horas_totales,
                COALESCE(AVG(ci.calificacion) FILTER (WHERE ci.calificacion IS NOT NULL), 0)::decimal AS promedio_calificacion
            FROM capacitacion_inscripciones ci
            WHERE ci.empleado_id = $1
        `, [req.params.eid]);

        const { rows: detalle } = await q(`
            SELECT ci.*, c.titulo, c.duracion_horas, c.tipo, c.modalidad,
                (SELECT folio FROM capacitacion_certificados cc WHERE cc.inscripcion_id = ci.id LIMIT 1) AS certificado_folio
            FROM capacitacion_inscripciones ci
            JOIN capacitaciones c ON c.id = ci.capacitacion_id
            WHERE ci.empleado_id = $1
            ORDER BY c.fecha_inicio DESC
        `, [req.params.eid]);

        res.json({ success: true, data: { resumen: hrs[0], detalle } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/reportes/evaluacion/:cid', async (req, res: Response) => {
    try {
        const { rows: inscrip } = await q(`
            SELECT ci.*, e.numero_empleado, e.nombre, e.apellido_paterno, e.departamento,
                COALESCE(ci.calificacion, 0)::decimal AS calif,
                (SELECT COUNT(*) FROM capacitacion_asistencia_sesion cas
                 WHERE cas.inscripcion_id = ci.id AND cas.presente = true)::int AS sesiones_asistidas,
                (SELECT COUNT(*) FROM capacitacion_asistentes ca
                 WHERE ca.capacitacion_id = ci.capacitacion_id)::int AS total_sesiones
            FROM capacitacion_inscripciones ci
            JOIN empleados e ON e.id = ci.empleado_id
            WHERE ci.capacitacion_id = $1
            ORDER BY calif DESC
        `, [req.params.cid]);

        const stats = {
            total: inscrip.length,
            promedio: inscrip.length > 0
                ? inscrip.reduce((s, r) => s + Number(r.calif), 0) / inscrip.length : 0,
            aprobados: inscrip.filter(r => Number(r.calif) >= 70).length,
            reprobados: inscrip.filter(r => Number(r.calif) < 70).length,
            completados: inscrip.filter(r => r.estatus === 'completado').length
        };

        res.json({ success: true, data: { stats, empleados: inscrip } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════

router.get('/notificaciones/:iid', async (req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT * FROM capacitacion_notificaciones
            WHERE inscripcion_id = $1 ORDER BY fecha_envio DESC
        `, [req.params.iid]);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/notificaciones/:nid/leida', async (req, res: Response) => {
    try {
        await q(`UPDATE capacitacion_notificaciones SET leida = true WHERE id = $1`, [req.params.nid]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

export default router;
