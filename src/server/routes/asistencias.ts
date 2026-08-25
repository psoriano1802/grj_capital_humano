import { Router, Request, Response } from 'express';
import asistenciaService from '../services/asistenciaService';
import { RegistrarAsistenciaDTO, BiometricAuthDTO } from '../types';

const router = Router();

// Marcar entrada/salida de forma unificada: decide según el registro del día
router.post('/marcar', async (req: Request, res: Response) => {
    try {
        const data: RegistrarAsistenciaDTO = req.body;
        const { asistencia, accion } = await asistenciaService.registrarMarcacion(data);
        res.status(accion === 'entrada' ? 201 : 200).json({
            success: true,
            data: asistencia,
            accion,
            message: accion === 'entrada' ? 'Entrada registrada exitosamente' : 'Salida registrada exitosamente'
        });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Obtener todas las asistencias (reporte)
router.get('/', async (req: Request, res: Response) => {
    try {
        const asistencias = await asistenciaService.getTodasLasAsistencias();
        res.json({ success: true, data: asistencias });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Registrar entrada
router.post('/entrada', async (req: Request, res: Response) => {
    try {
        const data: RegistrarAsistenciaDTO = req.body;
        const asistencia = await asistenciaService.registrarEntrada(data);
        res.status(201).json({
            success: true,
            data: asistencia,
            message: 'Entrada registrada exitosamente'
        });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Registrar salida
router.post('/salida', async (req: Request, res: Response) => {
    try {
        const data: RegistrarAsistenciaDTO = req.body;
        const asistencia = await asistenciaService.registrarSalida(data);
        res.json({
            success: true,
            data: asistencia,
            message: 'Salida registrada exitosamente'
        });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Obtener datos biométricos (rostros enrolados)
router.get('/rostros', async (req: Request, res: Response) => {
    try {
        const rostros = await asistenciaService.getRostrosEnrolados();
        res.json({ success: true, data: rostros });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Activar / desactivar un rostro enrolado
router.put('/rostros/:empleadoId/estado', async (req: Request, res: Response) => {
    try {
        const { empleadoId } = req.params;
        const { activo } = req.body;
        await asistenciaService.setRostroEstado(parseInt(empleadoId), Boolean(activo));
        res.json({ success: true, message: 'Estado del rostro actualizado' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Registrar datos biométricos
router.post('/biometrico', async (req: Request, res: Response) => {
    try {
        const data: BiometricAuthDTO = req.body;
        await asistenciaService.registrarBiometrico(data);
        res.status(201).json({
            success: true,
            message: 'Datos biométricos registrados exitosamente'
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener asistencias por empleado
router.get('/empleado/:empleadoId', async (req: Request, res: Response) => {
    try {
        const { empleadoId } = req.params;
        const { fecha_inicio, fecha_fin } = req.query;

        const fechaInicio = fecha_inicio ? new Date(fecha_inicio as string) : undefined;
        const fechaFin = fecha_fin ? new Date(fecha_fin as string) : undefined;

        const asistencias = await asistenciaService.getAsistenciasByEmpleado(
            parseInt(empleadoId),
            fechaInicio,
            fechaFin
        );
        res.json({ success: true, data: asistencias });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener asistencias del día
router.get('/dia/:fecha?', async (req: Request, res: Response) => {
    try {
        const { fecha } = req.params;
        const targetDate = fecha ? new Date(fecha) : undefined;
        const asistencias = await asistenciaService.getAsistenciasDelDia(targetDate);
        res.json({ success: true, data: asistencias });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener reporte de asistencias
router.get('/reporte', async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren fecha_inicio y fecha_fin'
            });
        }

        const fechaInicio = new Date(fecha_inicio as string);
        const fechaFin = new Date(fecha_fin as string);

        const reporte = await asistenciaService.getReporteAsistencias(fechaInicio, fechaFin);
        res.json({ success: true, data: reporte });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
