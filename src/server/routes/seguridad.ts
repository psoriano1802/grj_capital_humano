import { Router, Request, Response } from 'express';
import seguridadService from '../services/seguridadService';
import { UpdateUsuarioSeguridadDTO } from '../types';

const router = Router();

// Listar usuarios (empleados) con su perfil y estatus
router.get('/usuarios', async (_req: Request, res: Response) => {
    try {
        const usuarios = await seguridadService.getUsuarios();
        res.json({ success: true, data: usuarios });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Actualizar configuracion de un usuario (perfil + estatus)
router.put('/usuarios/:id', async (req: Request, res: Response) => {
    try {
        const data: UpdateUsuarioSeguridadDTO = req.body;
        const usuario = await seguridadService.updateUsuario(parseInt(req.params.id), data);
        res.json({ success: true, data: usuario, message: 'Usuario actualizado exitosamente' });
    } catch (error: any) {
        const status = error.message?.includes('inválido') ? 400 :
                       (error.message === 'Empleado no encontrado' ? 404 : 500);
        res.status(status).json({ success: false, error: error.message });
    }
});

// Accesos de un usuario (para filtrar el menu)
router.get('/usuarios/:id/accesos', async (req: Request, res: Response) => {
    try {
        const data = await seguridadService.getAccesosByEmpleado(parseInt(req.params.id));
        res.json({ success: true, data });
    } catch (error: any) {
        const status = error.message === 'Empleado no encontrado' ? 404 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

export default router;