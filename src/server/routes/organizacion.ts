import { Router, Request, Response } from 'express';
import pool from '../database/connection';

const router = Router();

// ── Helper ──────────────────────────────────────────────────
const q = (sql: string, params?: any[]) => pool.query(sql, params);

// ═══════════════════════════════════════════════════════════
// SUCURSALES
// ═══════════════════════════════════════════════════════════
router.get('/sucursales', async (_req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT *, 
                (SELECT COUNT(*) FROM departamentos d WHERE d.sucursal_id = s.id)::int AS total_departamentos
            FROM sucursales s
            ORDER BY tipo, nombre
        `);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/sucursales', async (req: Request, res: Response) => {
    try {
        const { clave, nombre, tipo, direccion, ciudad, estado, codigo_postal, telefono, responsable } = req.body;
        const { rows } = await q(
            `INSERT INTO sucursales (clave, nombre, tipo, direccion, ciudad, estado, codigo_postal, telefono, responsable)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [clave, nombre, tipo ?? 'SUCURSAL', direccion, ciudad, estado, codigo_postal, telefono, responsable]
        );
        res.status(201).json({ success: true, data: rows[0], message: 'Sucursal creada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/sucursales/:id', async (req: Request, res: Response) => {
    try {
        const { nombre, tipo, direccion, ciudad, estado, codigo_postal, telefono, responsable, activo } = req.body;
        const { rows } = await q(
            `UPDATE sucursales SET nombre=$1, tipo=$2, direccion=$3, ciudad=$4, estado=$5,
             codigo_postal=$6, telefono=$7, responsable=$8, activo=$9, updated_at=NOW()
             WHERE id=$10 RETURNING *`,
            [nombre, tipo, direccion, ciudad, estado, codigo_postal, telefono, responsable, activo, req.params.id]
        );
        res.json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/sucursales/:id', async (req: Request, res: Response) => {
    try {
        await q('UPDATE sucursales SET activo=FALSE, updated_at=NOW() WHERE id=$1', [req.params.id]);
        res.json({ success: true, message: 'Sucursal desactivada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// DEPARTAMENTOS
// ═══════════════════════════════════════════════════════════
router.get('/departamentos', async (_req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT d.*,
                s.nombre AS sucursal_nombre,
                p.nombre AS padre_nombre,
                (SELECT COUNT(*) FROM puestos pt WHERE pt.departamento_id = d.id)::int AS total_puestos
            FROM departamentos d
            LEFT JOIN sucursales s ON s.id = d.sucursal_id
            LEFT JOIN departamentos p ON p.id = d.padre_id
            ORDER BY d.nombre
        `);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/departamentos', async (req: Request, res: Response) => {
    try {
        const { clave, nombre, descripcion, sucursal_id, padre_id, responsable, cc_costo } = req.body;
        const { rows } = await q(
            `INSERT INTO departamentos (clave, nombre, descripcion, sucursal_id, padre_id, responsable, cc_costo)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [clave, nombre, descripcion, sucursal_id || null, padre_id || null, responsable, cc_costo]
        );
        res.status(201).json({ success: true, data: rows[0], message: 'Departamento creado' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/departamentos/:id', async (req: Request, res: Response) => {
    try {
        const { nombre, descripcion, sucursal_id, padre_id, responsable, cc_costo, activo } = req.body;
        const { rows } = await q(
            `UPDATE departamentos SET nombre=$1, descripcion=$2, sucursal_id=$3, padre_id=$4,
             responsable=$5, cc_costo=$6, activo=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
            [nombre, descripcion, sucursal_id || null, padre_id || null, responsable, cc_costo, activo, req.params.id]
        );
        res.json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// PUESTOS
// ═══════════════════════════════════════════════════════════
router.get('/puestos', async (_req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT pt.*,
                d.nombre AS departamento_nombre,
                d.clave  AS departamento_clave
            FROM puestos pt
            LEFT JOIN departamentos d ON d.id = pt.departamento_id
            ORDER BY pt.nivel_puesto, pt.nombre
        `);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/puestos', async (req: Request, res: Response) => {
    try {
        const { clave, nombre, descripcion, nivel_puesto, departamento_id, salario_min, salario_max } = req.body;
        const { rows } = await q(
            `INSERT INTO puestos (clave, nombre, descripcion, nivel_puesto, departamento_id, salario_min, salario_max)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [clave, nombre, descripcion, nivel_puesto, departamento_id || null, salario_min || null, salario_max || null]
        );
        res.status(201).json({ success: true, data: rows[0], message: 'Puesto creado' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/puestos/:id', async (req: Request, res: Response) => {
    try {
        const { nombre, descripcion, nivel_puesto, departamento_id, salario_min, salario_max, activo } = req.body;
        const { rows } = await q(
            `UPDATE puestos SET nombre=$1, descripcion=$2, nivel_puesto=$3, departamento_id=$4,
             salario_min=$5, salario_max=$6, activo=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
            [nombre, descripcion, nivel_puesto, departamento_id || null, salario_min || null, salario_max || null, activo, req.params.id]
        );
        res.json({ success: true, data: rows[0] });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// NIVELES DE PUESTO
// ═══════════════════════════════════════════════════════════
router.get('/niveles-puesto', async (_req, res: Response) => {
    try {
        const { rows } = await q('SELECT * FROM niveles_puesto WHERE activo=TRUE ORDER BY orden');
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// CENTROS DE COSTO
// ═══════════════════════════════════════════════════════════
router.get('/centros-costo', async (_req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT cc.*,
                s.nombre AS sucursal_nombre,
                d.nombre AS departamento_nombre
            FROM centros_costo cc
            LEFT JOIN sucursales s ON s.id = cc.sucursal_id
            LEFT JOIN departamentos d ON d.id = cc.departamento_id
            WHERE cc.activo=TRUE ORDER BY cc.clave
        `);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/centros-costo', async (req: Request, res: Response) => {
    try {
        const { clave, nombre, descripcion, sucursal_id, departamento_id } = req.body;
        const { rows } = await q(
            `INSERT INTO centros_costo (clave, nombre, descripcion, sucursal_id, departamento_id)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [clave, nombre, descripcion, sucursal_id || null, departamento_id || null]
        );
        res.status(201).json({ success: true, data: rows[0], message: 'Centro de costo creado' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// ORGANIGRAMA
// ═══════════════════════════════════════════════════════════
router.get('/organigrama', async (_req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT o.*,
                p.nombre  AS puesto_nombre,  p.nivel_puesto,
                pj.nombre AS jefe_nombre,
                d.nombre  AS departamento_nombre
            FROM organigrama o
            JOIN puestos p ON p.id = o.puesto_id
            LEFT JOIN puestos pj ON pj.id = o.puesto_jefe_id
            LEFT JOIN departamentos d ON d.id = o.departamento_id
            WHERE o.vigente=TRUE
            ORDER BY o.nivel_jerarquico, p.nombre
        `);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// Comprueba si asignar `puesto_id` bajo `puesto_jefe_id` crearía un ciclo
// (puesto_id sería ancestro del nuevo jefe). Devuelve true si hay ciclo.
const hasCycle = async (puesto_id: number | string, puesto_jefe_id: number | string | null | undefined): Promise<boolean> => {
    if (puesto_jefe_id == null || puesto_jefe_id === '') return false; // sin jefe = raíz, sin ciclo
    if (Number(puesto_id) === Number(puesto_jefe_id)) return true; // auto-referencia
    const { rows } = await q(`
        WITH RECURSIVE chain AS (
            SELECT o.puesto_jefe_id AS boss
            FROM organigrama o
            WHERE o.puesto_id = $2 AND o.vigente=TRUE
            UNION ALL
            SELECT o.puesto_jefe_id
            FROM organigrama o
            JOIN chain c ON o.puesto_id = c.boss
            WHERE o.vigente=TRUE
        )
        CYCLE boss SET is_cycle USING path
        SELECT EXISTS(SELECT 1 FROM chain WHERE boss = $1 AND is_cycle = FALSE)::boolean AS cycle
    `, [puesto_id, puesto_jefe_id]);
    return rows[0].cycle;
};

router.post('/organigrama', async (req: Request, res: Response) => {
    try {
        const { puesto_id, puesto_jefe_id, departamento_id, nivel_jerarquico, es_jefe_directo } = req.body;
        if (await hasCycle(puesto_id, puesto_jefe_id)) {
            return res.status(400).json({ success: false, error: 'La relación crearía un ciclo jerárquico' });
        }
        const { rows } = await q(
            `INSERT INTO organigrama (puesto_id, puesto_jefe_id, departamento_id, nivel_jerarquico, es_jefe_directo)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [puesto_id, puesto_jefe_id || null, departamento_id || null, nivel_jerarquico ?? 1, es_jefe_directo ?? true]
        );
        res.status(201).json({ success: true, data: rows[0], message: 'Relación jerárquica creada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/organigrama/:id', async (req: Request, res: Response) => {
    try {
        const { puesto_jefe_id, departamento_id, nivel_jerarquico, es_jefe_directo, vigente } = req.body;
        const cur = await q('SELECT puesto_id FROM organigrama WHERE id=$1', [req.params.id]);
        if (cur.rowCount === 0) return res.status(404).json({ success: false, error: 'Relación jerárquica no encontrada' });
        if (await hasCycle(cur.rows[0].puesto_id, puesto_jefe_id)) {
            return res.status(400).json({ success: false, error: 'La relación crearía un ciclo jerárquico' });
        }
        const { rows } = await q(
            `UPDATE organigrama
             SET puesto_jefe_id=$1, departamento_id=$2, nivel_jerarquico=$3, es_jefe_directo=$4, vigente=$5
             WHERE id=$6 RETURNING *`,
            [puesto_jefe_id || null, departamento_id || null, nivel_jerarquico ?? 1, es_jefe_directo ?? true, vigente ?? true, req.params.id]
        );
        res.json({ success: true, data: rows[0], message: 'Relación jerárquica actualizada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/organigrama/:id', async (req: Request, res: Response) => {
    try {
        await q('UPDATE organigrama SET vigente=FALSE WHERE id=$1', [req.params.id]);
        res.json({ success: true, message: 'Relación jerárquica desactivada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// UBICACIONES FÍSICAS
// ═══════════════════════════════════════════════════════════
router.get('/ubicaciones', async (_req, res: Response) => {
    try {
        const { rows } = await q(`
            SELECT u.*, s.nombre AS sucursal_nombre
            FROM ubicaciones_fisicas u
            LEFT JOIN sucursales s ON s.id = u.sucursal_id
            WHERE u.activo=TRUE ORDER BY u.tipo, u.nombre
        `);
        res.json({ success: true, data: rows });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/ubicaciones', async (req: Request, res: Response) => {
    try {
        const { clave, nombre, tipo, sucursal_id, piso, descripcion, capacidad } = req.body;
        const { rows } = await q(
            `INSERT INTO ubicaciones_fisicas (clave, nombre, tipo, sucursal_id, piso, descripcion, capacidad)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [clave, nombre, tipo ?? 'OFICINA', sucursal_id || null, piso, descripcion, capacidad || null]
        );
        res.status(201).json({ success: true, data: rows[0], message: 'Ubicación creada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── RESUMEN GENERAL ────────────────────────────────────────
router.get('/resumen', async (_req, res: Response) => {
    try {
        const [suc, dep, pue, cc, ubi] = await Promise.all([
            q('SELECT COUNT(*)::int AS total FROM sucursales WHERE activo=TRUE'),
            q('SELECT COUNT(*)::int AS total FROM departamentos WHERE activo=TRUE'),
            q('SELECT COUNT(*)::int AS total FROM puestos WHERE activo=TRUE'),
            q('SELECT COUNT(*)::int AS total FROM centros_costo WHERE activo=TRUE'),
            q('SELECT COUNT(*)::int AS total FROM ubicaciones_fisicas WHERE activo=TRUE'),
        ]);
        res.json({
            success: true,
            data: {
                sucursales:       suc.rows[0].total,
                departamentos:    dep.rows[0].total,
                puestos:          pue.rows[0].total,
                centros_costo:    cc.rows[0].total,
                ubicaciones:      ubi.rows[0].total,
            }
        });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

export default router;
