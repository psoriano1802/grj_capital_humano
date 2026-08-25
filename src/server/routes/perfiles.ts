import { Router, Request, Response } from 'express';
import seguridadService from '../services/seguridadService';
import { CreatePerfilDTO, UpdatePerfilDTO, SetPerfilAccesosDTO } from '../types';

const router = Router();

// Listar perfiles
router.get('/', async (_req: Request, res: Response) => {
    try {
        const perfiles = await seguridadService.getPerfiles();
        res.json({ success: true, data: perfiles });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear perfil
router.post('/', async (req: Request, res: Response) => {
    try {
        const data: CreatePerfilDTO = req.body;
        const perfil = await seguridadService.createPerfil(data);
        res.status(201).json({ success: true, data: perfil, message: 'Perfil creado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Detalle de perfil
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const perfil = await seguridadService.getPerfil(parseInt(req.params.id));
        res.json({ success: true, data: perfil });
    } catch (error: any) {
        const status = error.message === 'Perfil no encontrado' ? 404 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

// Actualizar perfil
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const data: UpdatePerfilDTO = req.body;
        const perfil = await seguridadService.updatePerfil(parseInt(req.params.id), data);
        res.json({ success: true, data: perfil, message: 'Perfil actualizado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar perfil
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await seguridadService.deletePerfil(parseInt(req.params.id));
        res.json({ success: true, message: 'Perfil eliminado exitosamente' });
    } catch (error: any) {
        const status = error.message?.includes('asignado a empleados') ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

// Accesos de un perfil (todos los accesos con su asignacion a ese perfil)
router.get('/:id/accesos', async (req: Request, res: Response) => {
    try {
        const accesos = await seguridadService.getAccesosByPerfil(parseInt(req.params.id));
        res.json({ success: true, data: accesos });
    } catch (error: any) {
        const status = error.message === 'Perfil no encontrado' ? 404 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

// Asignar accesos a un perfil (reemplaza el conjunto)
router.put('/:id/accesos', async (req: Request, res: Response) => {
    try {
        const { acceso_ids }: SetPerfilAccesosDTO = req.body;
        if (!Array.isArray(acceso_ids)) {
            return res.status(400).json({ success: false, error: 'Se requiere acceso_ids (arreglo de ids)' });
        }
        await seguridadService.setAccesosPerfil(parseInt(req.params.id), acceso_ids);
        res.json({ success: true, message: 'Accesos del perfil actualizados exitosamente' });
    } catch (error: any) {
        const status = error.message === 'Perfil no encontrado' ? 404 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

export default router;