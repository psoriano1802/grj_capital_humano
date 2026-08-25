import { Router, Request, Response } from 'express';
import { pool } from '../database/connection';

const router = Router();

// Endpoint genérico para obtener catálogos de contratación
router.get('/catalogos/:tipo', async (req: Request, res: Response) => {
    try {
        const { tipo } = req.params;
        let table = '';
        
        switch (tipo) {
            case 'tipos_contratacion': table = 'cat_tipos_contratacion'; break;
            case 'tipos_empleado': table = 'cat_tipos_empleado'; break;
            case 'tipos_jornada': table = 'cat_tipos_jornada'; break;
            case 'turnos': table = 'cat_turnos'; break;
            case 'horarios_laborales': table = 'cat_horarios_laborales'; break;
            case 'politicas_descanso': table = 'cat_politicas_descanso'; break;
            case 'calendarios_laborales': table = 'cat_calendarios_laborales'; break;
            case 'prestaciones': table = 'cat_prestaciones'; break;
            case 'esquemas_pago': table = 'cat_esquemas_pago'; break;
            case 'tipos_contrato': table = 'cat_tipos_contrato'; break;
            default:
                return res.status(400).json({ success: false, error: 'Catálogo no válido' });
        }

        const query = `SELECT * FROM ${table} ORDER BY id ASC`;
        const result = await pool.query(query);
        
        res.json({ success: true, data: result.rows });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint genérico para crear un elemento de catálogo
router.post('/catalogos/:tipo', async (req: Request, res: Response) => {
    try {
        const { tipo } = req.params;
        const { nombre, descripcion } = req.body;
        let table = '';
        
        switch (tipo) {
            case 'tipos_contratacion': table = 'cat_tipos_contratacion'; break;
            case 'tipos_empleado': table = 'cat_tipos_empleado'; break;
            case 'tipos_jornada': table = 'cat_tipos_jornada'; break;
            case 'turnos': table = 'cat_turnos'; break;
            case 'horarios_laborales': table = 'cat_horarios_laborales'; break;
            case 'politicas_descanso': table = 'cat_politicas_descanso'; break;
            case 'calendarios_laborales': table = 'cat_calendarios_laborales'; break;
            case 'prestaciones': table = 'cat_prestaciones'; break;
            case 'esquemas_pago': table = 'cat_esquemas_pago'; break;
            case 'tipos_contrato': table = 'cat_tipos_contrato'; break;
            default:
                return res.status(400).json({ success: false, error: 'Catálogo no válido' });
        }

        const query = `INSERT INTO ${table} (nombre, descripcion) VALUES ($1, $2) RETURNING *`;
        const result = await pool.query(query, [nombre, descripcion]);
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint genérico para eliminar (desactivar) un elemento de catálogo
router.delete('/catalogos/:tipo/:id', async (req: Request, res: Response) => {
    try {
        const { tipo, id } = req.params;
        let table = '';
        
        switch (tipo) {
            case 'tipos_contratacion': table = 'cat_tipos_contratacion'; break;
            case 'tipos_empleado': table = 'cat_tipos_empleado'; break;
            case 'tipos_jornada': table = 'cat_tipos_jornada'; break;
            case 'turnos': table = 'cat_turnos'; break;
            case 'horarios_laborales': table = 'cat_horarios_laborales'; break;
            case 'politicas_descanso': table = 'cat_politicas_descanso'; break;
            case 'calendarios_laborales': table = 'cat_calendarios_laborales'; break;
            case 'prestaciones': table = 'cat_prestaciones'; break;
            case 'esquemas_pago': table = 'cat_esquemas_pago'; break;
            case 'tipos_contrato': table = 'cat_tipos_contrato'; break;
            default:
                return res.status(400).json({ success: false, error: 'Catálogo no válido' });
        }

        const query = `DELETE FROM ${table} WHERE id = $1`;
        await pool.query(query, [id]);
        
        res.json({ success: true, message: 'Elemento eliminado correctamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener todos los catálogos en una sola llamada (útil para el frontend)
router.get('/todos-catalogos', async (req: Request, res: Response) => {
    try {
        const queries = [
            pool.query('SELECT * FROM cat_tipos_contratacion ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_tipos_empleado ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_tipos_jornada ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_turnos ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_horarios_laborales ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_politicas_descanso ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_calendarios_laborales ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_prestaciones ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_esquemas_pago ORDER BY id ASC'),
            pool.query('SELECT * FROM cat_tipos_contrato ORDER BY id ASC')
        ];

        const results = await Promise.all(queries);

        res.json({
            success: true,
            data: {
                tipos_contratacion: results[0].rows,
                tipos_empleado: results[1].rows,
                tipos_jornada: results[2].rows,
                turnos: results[3].rows,
                horarios_laborales: results[4].rows,
                politicas_descanso: results[5].rows,
                calendarios_laborales: results[6].rows,
                prestaciones: results[7].rows,
                esquemas_pago: results[8].rows,
                tipos_contrato: results[9].rows
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
