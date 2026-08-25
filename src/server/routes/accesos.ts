import { Router, Request, Response } from 'express';
import seguridadService from '../services/seguridadService';
import { CreateAccesoDTO, UpdateAccesoDTO } from '../types';

const router = Router();

// Listar accesos (modulos)
router.get('/', async (_req: Request, res: Response) => {
    try {
        const accesos = await seguridadService.getAccesos();
        res.json({ success: true, data: accesos });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear acceso (modulo nuevo)
router.post('/', async (req: Request, res: Response) => {
    try {
        const data: CreateAccesoDTO = req.body;
        const acceso = await seguridadService.createAcceso(data);
        res.status(201).json({ success: true, data: acceso, message: 'Acceso creado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Actualizar acceso
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const data: UpdateAccesoDTO = req.body;
        const acceso = await seguridadService.updateAcceso(parseInt(req.params.id), data);
        res.json({ success: true, data: acceso, message: 'Acceso actualizado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar acceso
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await seguridadService.deleteAcceso(parseInt(req.params.id));
        res.json({ success: true, message: 'Acceso eliminado exitosamente' });
    } catch (error: any) {
        const status = error.message?.includes('asignado a perfiles') ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

export default router;