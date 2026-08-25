import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import svc from '../services/reclutamientoService';
import { CreateVacanteDTO, CreateAspiranteDTO, CreateEntrevistaDTO, CreatePruebaDTO, AvanzarEtapaDTO } from '../types/reclutamiento';

const router = Router();

// ── UPLOAD DE ARCHIVOS ─────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'reclutamiento');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_\-]/g, '_')
            .substring(0, 40);
        cb(null, `${Date.now()}_${base}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error(`Tipo de archivo no permitido: ${ext}`));
    },
});

router.post('/upload', upload.single('archivo'), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
    const url = `/uploads/reclutamiento/${req.file.filename}`;
    res.json({
        success: true,
        data: { url, nombre: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype },
        message: 'Archivo subido correctamente',
    });
});



// ── CATÁLOGOS ──────────────────────────────────────────────────
router.get('/catalogos', async (_req, res: Response) => {
    try {
        const data = await svc.getAllCatalogosReclutamiento();
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/catalogos/:categoria', async (req: Request, res: Response) => {
    try {
        const data = await svc.getCatalogos(req.params.categoria);
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── VACANTES ───────────────────────────────────────────────────
router.get('/vacantes', async (req: Request, res: Response) => {
    try {
        const data = await svc.getAllVacantes(req.query.estatus as string);
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/vacantes/estadisticas', async (_req, res: Response) => {
    try {
        const data = await svc.getEstadisticasVacantes();
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/vacantes/:id', async (req: Request, res: Response) => {
    try {
        const data = await svc.getVacanteById(Number(req.params.id));
        if (!data) return res.status(404).json({ success: false, error: 'Vacante no encontrada' });
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/vacantes', async (req: Request, res: Response) => {
    try {
        const data = await svc.createVacante(req.body as CreateVacanteDTO);
        res.status(201).json({ success: true, data, message: 'Vacante creada exitosamente' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/vacantes/:id', async (req: Request, res: Response) => {
    try {
        const data = await svc.updateVacante(Number(req.params.id), req.body);
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.patch('/vacantes/:id/estatus', async (req: Request, res: Response) => {
    try {
        const data = await svc.cambiarEstatusVacante(Number(req.params.id), req.body.estatus);
        res.json({ success: true, data, message: 'Estatus actualizado' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── PIPELINE KANBAN ────────────────────────────────────────────
router.get('/pipeline', async (req: Request, res: Response) => {
    try {
        const vacanteId = req.query.vacante_id ? Number(req.query.vacante_id) : undefined;
        const data = await svc.getPipeline(vacanteId);
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── ASPIRANTES ─────────────────────────────────────────────────
router.get('/aspirantes', async (req: Request, res: Response) => {
    try {
        const filters = {
            estatus: req.query.estatus as string,
            etapa:   req.query.etapa   as string,
            vacante_id: req.query.vacante_id ? Number(req.query.vacante_id) : undefined,
        };
        const data = await svc.getAllAspirantes(filters);
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/aspirantes/estadisticas', async (req: Request, res: Response) => {
    try {
        const vacanteId = req.query.vacante_id ? Number(req.query.vacante_id) : undefined;
        const data = await svc.getEstadisticasAspirantes(vacanteId);
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/aspirantes/:id', async (req: Request, res: Response) => {
    try {
        const data = await svc.getAspiranteById(Number(req.params.id));
        if (!data) return res.status(404).json({ success: false, error: 'Aspirante no encontrado' });
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/aspirantes', async (req: Request, res: Response) => {
    try {
        const data = await svc.createAspirante(req.body as CreateAspiranteDTO);
        res.status(201).json({ success: true, data, message: 'Aspirante registrado exitosamente' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/aspirantes/:id/etapa', async (req: Request, res: Response) => {
    try {
        const body: AvanzarEtapaDTO = { aspirante_id: Number(req.params.id), ...req.body };
        const data = await svc.avanzarEtapa(body);
        res.json({ success: true, data, message: 'Etapa actualizada' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/aspirantes/:id/rechazar', async (req: Request, res: Response) => {
    try {
        const { motivo, notas } = req.body;
        if (!motivo) return res.status(400).json({ success: false, error: 'Se requiere motivo de rechazo' });
        const data = await svc.rechazarAspirante(Number(req.params.id), motivo, notas);
        res.json({ success: true, data, message: 'Aspirante rechazado' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/aspirantes/:id/aprobar', async (_req: Request, res: Response) => {
    try {
        const data = await svc.aprobarAspirante(Number(_req.params.id));
        res.json({ success: true, data, message: 'Aspirante aprobado para contratación' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── ENTREVISTAS ────────────────────────────────────────────────
router.get('/aspirantes/:id/entrevistas', async (req: Request, res: Response) => {
    try {
        const data = await svc.getEntrevistasByAspirante(Number(req.params.id));
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/entrevistas', async (req: Request, res: Response) => {
    try {
        const data = await svc.createEntrevista(req.body as CreateEntrevistaDTO);
        res.status(201).json({ success: true, data, message: 'Entrevista programada exitosamente' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/entrevistas/:id/resultado', async (req: Request, res: Response) => {
    try {
        const { calificacion, comentarios, estatus } = req.body;
        const data = await svc.registrarResultadoEntrevista(
            Number(req.params.id), calificacion, comentarios, estatus
        );
        res.json({ success: true, data, message: 'Resultado de entrevista registrado' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── PRUEBAS ────────────────────────────────────────────────────
router.get('/aspirantes/:id/pruebas', async (req: Request, res: Response) => {
    try {
        const data = await svc.getPruebasByAspirante(Number(req.params.id));
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/pruebas', async (req: Request, res: Response) => {
    try {
        const data = await svc.createPrueba(req.body as CreatePruebaDTO);
        res.status(201).json({ success: true, data, message: 'Prueba registrada exitosamente' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── DOCUMENTOS ─────────────────────────────────────────────────
router.get('/aspirantes/:id/documentos', async (req: Request, res: Response) => {
    try {
        const data = await svc.getDocumentosByAspirante(Number(req.params.id));
        res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/documentos', async (req: Request, res: Response) => {
    try {
        const { aspirante_id, tipo_documento, nombre_archivo, archivo_url } = req.body;
        const data = await svc.registrarDocumento(aspirante_id, tipo_documento, nombre_archivo, archivo_url);
        res.status(201).json({ success: true, data, message: 'Documento registrado' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/documentos/:id/validar', async (req: Request, res: Response) => {
    try {
        const { estatus, notas } = req.body;
        const data = await svc.validarDocumento(Number(req.params.id), estatus, notas);
        res.json({ success: true, data, message: 'Documento actualizado' });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

export default router;
