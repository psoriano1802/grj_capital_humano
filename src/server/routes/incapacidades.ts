import { Router, Request, Response } from 'express';
import incapacidadService from '../services/incapacidadService';
import { CreateIncapacidadDTO } from '../types';

const router = Router();

// Crear incapacidad
router.post('/', async (req: Request, res: Response) => {
    try {
        const data: CreateIncapacidadDTO = req.body;
        const incapacidad = await incapacidadService.createIncapacidad(data);
        res.status(201).json({
            success: true,
            data: incapacidad,
            message: 'Incapacidad registrada exitosamente'
        });
    } catch (error: any) {
        const statusCode = error.message?.includes('No existe un empleado') ? 400 : 500;
        res.status(statusCode).json({ success: false, error: error.message });
    }
});

// Obtener incapacidades por empleado
router.get('/empleado/:empleadoId', async (req: Request, res: Response) => {
    try {
        const { empleadoId } = req.params;
        const incapacidades = await incapacidadService.getIncapacidadesByEmpleado(parseInt(empleadoId));
        res.json({ success: true, data: incapacidades });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener incapacidades activas
router.get('/activas', async (req: Request, res: Response) => {
    try {
        const incapacidades = await incapacidadService.getIncapacidadesActivas();
        res.json({ success: true, data: incapacidades });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Finalizar incapacidad
router.put('/:id/finalizar', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const incapacidad = await incapacidadService.finalizarIncapacidad(parseInt(id));
        res.json({
            success: true,
            data: incapacidad,
            message: 'Incapacidad finalizada exitosamente'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancelar incapacidad
router.put('/:id/cancelar', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const incapacidad = await incapacidadService.cancelarIncapacidad(parseInt(id));
        res.json({
            success: true,
            data: incapacidad,
            message: 'Incapacidad cancelada'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Actualizar incapacidad
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data: Partial<CreateIncapacidadDTO> = req.body;
        const incapacidad = await incapacidadService.updateIncapacidad(parseInt(id), data);
        res.json({
            success: true,
            data: incapacidad,
            message: 'Incapacidad actualizada exitosamente'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener incapacidades por fechas
router.get('/fechas', async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        const incapacidades = await incapacidadService.getIncapacidadesByFechas(
            new Date(fecha_inicio as string),
            new Date(fecha_fin as string)
        );
        res.json({ success: true, data: incapacidades });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener estadísticas
router.get('/estadisticas/:empleadoId?', async (req: Request, res: Response) => {
    try {
        const { empleadoId } = req.params;
        const stats = await incapacidadService.getEstadisticasIncapacidades(
            empleadoId ? parseInt(empleadoId) : undefined
        );
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
