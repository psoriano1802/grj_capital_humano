import { Router, Request, Response } from 'express';
import vacacionService from '../services/vacacionService';
import { CreateVacacionDTO } from '../types';

const router = Router();

// Solicitar vacaciones
router.post('/', async (req: Request, res: Response) => {
    try {
        const data: CreateVacacionDTO = req.body;
        const vacacion = await vacacionService.solicitarVacaciones(data);
        res.status(201).json({
            success: true,
            data: vacacion,
            message: 'Solicitud de vacaciones creada exitosamente'
        });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Obtener vacaciones por empleado
router.get('/empleado/:empleadoId', async (req: Request, res: Response) => {
    try {
        const { empleadoId } = req.params;
        const vacaciones = await vacacionService.getVacacionesByEmpleado(parseInt(empleadoId));
        res.json({ success: true, data: vacaciones });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener balance de vacaciones
router.get('/balance/:empleadoId/:year', async (req: Request, res: Response) => {
    try {
        const { empleadoId, year } = req.params;
        const balance = await vacacionService.getBalanceVacaciones(
            parseInt(empleadoId),
            parseInt(year)
        );
        res.json({ success: true, data: balance });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener vacaciones pendientes
router.get('/pendientes', async (req: Request, res: Response) => {
    try {
        const vacaciones = await vacacionService.getVacacionesPendientes();
        res.json({ success: true, data: vacaciones });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reporte general de todas las solicitudes de vacaciones
router.get('/reporte', async (_req: Request, res: Response) => {
    try {
        const vacaciones = await vacacionService.getReporteVacaciones();
        res.json({ success: true, data: vacaciones });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Aprobar vacaciones
router.put('/:id/aprobar', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { aprobado_por, comentarios } = req.body;
        const vacacion = await vacacionService.aprobarVacaciones(
            parseInt(id),
            aprobado_por,
            comentarios
        );
        res.json({
            success: true,
            data: vacacion,
            message: 'Vacaciones aprobadas exitosamente'
        });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Rechazar vacaciones
router.put('/:id/rechazar', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { aprobado_por, comentarios } = req.body;

        if (!comentarios) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un comentario para rechazar las vacaciones'
            });
        }

        const vacacion = await vacacionService.rechazarVacaciones(
            parseInt(id),
            aprobado_por,
            comentarios
        );
        res.json({
            success: true,
            data: vacacion,
            message: 'Vacaciones rechazadas'
        });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Inicializar vacaciones para un empleado
router.post('/inicializar', async (req: Request, res: Response) => {
    try {
        const { empleado_id, year } = req.body;
        const vacacion = await vacacionService.inicializarVacaciones(empleado_id, year);
        res.status(201).json({
            success: true,
            data: vacacion,
            message: 'Vacaciones inicializadas exitosamente'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
