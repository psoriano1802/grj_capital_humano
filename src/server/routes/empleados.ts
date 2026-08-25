import { Router, Request, Response } from 'express';
import empleadoService from '../services/empleadoService';
import { CreateEmpleadoDTO } from '../types';

const router = Router();

// Obtener todos los empleados
router.get('/', async (req: Request, res: Response) => {
    try {
        const empleados = await empleadoService.getAllEmpleados();
        res.json({ success: true, data: empleados });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Buscar empleados
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, error: 'Parámetro de búsqueda requerido' });
        }
        const empleados = await empleadoService.searchEmpleados(q as string);
        res.json({ success: true, data: empleados });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener empleado por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const empleado = await empleadoService.getEmpleadoById(parseInt(id));
        if (!empleado) {
            return res.status(404).json({ success: false, error: 'Empleado no encontrado' });
        }
        res.json({ success: true, data: empleado });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear empleado a partir de un aspirante aprobado (traspaso al modulo de empleados)
router.post('/desde-aspirante', async (req: Request, res: Response) => {
    try {
        const { aspirante_id } = req.body;
        if (!aspirante_id) {
            return res.status(400).json({ success: false, error: 'Se requiere aspirante_id' });
        }
        const result = await empleadoService.crearEmpleadoDesdeAspirante(parseInt(aspirante_id));
        res.status(201).json({
            success: true,
            data: result.empleado,
            ya_existia: result.ya_existia,
            message: result.ya_existia
                ? 'El aspirante ya había sido contratado'
                : 'Empleado creado desde aspirante. Completa los datos faltantes.'
        });
    } catch (error: any) {
        const status = error.message?.includes('aprobado') || error.message?.includes('correo') || error.message?.includes('no encontrado')
            ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
});

// Crear empleado
router.post('/', async (req: Request, res: Response) => {
    try {
        const { datos_biometricos, tipo_biometrico, ...data } = req.body as CreateEmpleadoDTO & {
            datos_biometricos?: string;
            tipo_biometrico?: 'faceid' | 'huella';
        };
        const empleado = await empleadoService.createEmpleado(data);

        if (datos_biometricos) {
            const { default: asistenciaService } = await import('../services/asistenciaService');
            await asistenciaService.registrarBiometrico({
                empleado_id: empleado.id!,
                tipo: tipo_biometrico || 'faceid',
                datos_biometricos
            });
        }

        res.status(201).json({ success: true, data: empleado });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Actualizar empleado
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data: Partial<CreateEmpleadoDTO> = req.body;
        const empleado = await empleadoService.updateEmpleado(parseInt(id), data);
        res.json({ success: true, data: empleado });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Desactivar empleado
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await empleadoService.deactivateEmpleado(parseInt(id));
        res.json({ success: true, message: 'Empleado desactivado exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener empleados por departamento
router.get('/departamento/:departamento', async (req: Request, res: Response) => {
    try {
        const { departamento } = req.params;
        const empleados = await empleadoService.getEmpleadosByDepartamento(departamento);
        res.json({ success: true, data: empleados });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
