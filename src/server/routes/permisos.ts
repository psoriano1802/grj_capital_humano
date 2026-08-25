import { Router, Request, Response } from 'express';
import permisoService from '../services/permisoService';
import { CreatePermisoDTO } from '../types';

const router = Router();

// Crear solicitud de permiso
router.post('/', async (req: Request, res: Response) => {
    try {
        const data: CreatePermisoDTO = req.body;
        const permiso = await permisoService.createPermiso(data);
        res.status(201).json({
            success: true,
            data: permiso,
            message: 'Solicitud de permiso creada exitosamente'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener permisos por empleado
router.get('/empleado/:empleadoId', async (req: Request, res: Response) => {
    try {
        const { empleadoId } = req.params;
        const permisos = await permisoService.getPermisosByEmpleado(parseInt(empleadoId));
        res.json({ success: true, data: permisos });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener permisos pendientes (filtrados por el aprobador que consulta)
router.get('/pendientes', async (req: Request, res: Response) => {
    try {
        const { aprobador_id } = req.query;
        if (!aprobador_id) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere el parámetro aprobador_id'
            });
        }
        const permisos = await permisoService.getPermisosPendientesParaAprobador(parseInt(aprobador_id as string));
        res.json({ success: true, data: permisos });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Aprobar permiso
router.put('/:id/aprobar', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { aprobado_por, comentarios } = req.body;

        const puede = await permisoService.puedeAprobarPermiso(parseInt(id), aprobado_por);
        if (!puede) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para aprobar esta solicitud'
            });
        }

        const permiso = await permisoService.aprobarPermiso(
            parseInt(id),
            aprobado_por,
            comentarios
        );
        res.json({
            success: true,
            data: permiso,
            message: 'Permiso aprobado exitosamente'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rechazar permiso
router.put('/:id/rechazar', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { aprobado_por, comentarios } = req.body;

        if (!comentarios) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un comentario para rechazar el permiso'
            });
        }

        const puede = await permisoService.puedeAprobarPermiso(parseInt(id), aprobado_por);
        if (!puede) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para rechazar esta solicitud'
            });
        }

        const permiso = await permisoService.rechazarPermiso(
            parseInt(id),
            aprobado_por,
            comentarios
        );
        res.json({
            success: true,
            data: permiso,
            message: 'Permiso rechazado'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener permisos por fechas
router.get('/fechas', async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        const permisos = await permisoService.getPermisosByFechas(
            new Date(fecha_inicio as string),
            new Date(fecha_fin as string)
        );
        res.json({ success: true, data: permisos });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancelar permiso
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await permisoService.cancelarPermiso(parseInt(id));
        res.json({ success: true, message: 'Permiso cancelado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener estadísticas
router.get('/estadisticas/:empleadoId?', async (req: Request, res: Response) => {
    try {
        const { empleadoId } = req.params;
        const stats = await permisoService.getEstadisticasPermisos(
            empleadoId ? parseInt(empleadoId) : undefined
        );
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
