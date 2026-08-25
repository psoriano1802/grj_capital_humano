import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { testConnection } from './database/connection';

// Importar rutas
import empleadosRoutes from './routes/empleados';
import asistenciasRoutes from './routes/asistencias';
import permisosRoutes from './routes/permisos';
import vacacionesRoutes from './routes/vacaciones';
import incapacidadesRoutes from './routes/incapacidades';
import reclutamientoRoutes from './routes/reclutamiento';
import organizacionRoutes from './routes/organizacion';
import contratacionRoutes from './routes/contratacion';
import perfilesRoutes from './routes/perfiles';
import accesosRoutes from './routes/accesos';
import seguridadRoutes from './routes/seguridad';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet({ 
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // Deshabilitar CSP para evitar que force HTTPS en el servidor de pruebas
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Si estamos en producción (o si existe la carpeta dist), servir el frontend de React
const clientDistPath = path.join(__dirname, 'client');
app.use(express.static(clientDistPath));

// Rutas principales de la API
app.get('/api', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'API de Recursos Humanos',
        version: '1.0.0',
        endpoints: {
            empleados: '/api/empleados',
            asistencias: '/api/asistencias',
            permisos: '/api/permisos',
            vacaciones: '/api/vacaciones',
            incapacidades: '/api/incapacidades',
            reclutamiento: '/api/reclutamiento'
        }
    });
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
    const dbConnected = await testConnection();
    res.json({
        success: true,
        status: 'OK',
        database: dbConnected ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Rutas de la API
app.use('/api/empleados', empleadosRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/vacaciones', vacacionesRoutes);
app.use('/api/incapacidades', incapacidadesRoutes);
app.use('/api/reclutamiento', reclutamientoRoutes);
app.use('/api/organizacion', organizacionRoutes);
app.use('/api/contratacion', contratacionRoutes);
app.use('/api/perfiles', perfilesRoutes);
app.use('/api/accesos', accesosRoutes);
app.use('/api/seguridad', seguridadRoutes);

// Manejo de rutas no encontradas de API
app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada'
    });
});

// Cualquier otra ruta no capturada por API ni por archivos estáticos,
// devuelve el index.html de React (manejo de React Router)
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
        if (err) {
            res.status(500).send('Error loading frontend');
        }
    });
});

// Manejo de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
const startServer = async () => {
    try {
        // Verificar conexión a la base de datos
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✅ Base de datos: Conectada`);
            console.log('='.repeat(50));
            console.log('\n📋 Endpoints disponibles:');
            console.log(`   - GET  /health`);
            console.log(`   - GET  /api/empleados`);
            console.log(`   - POST /api/asistencias/entrada`);
            console.log(`   - POST /api/asistencias/salida`);
            console.log(`   - GET  /api/permisos/pendientes`);
            console.log(`   - GET  /api/vacaciones/pendientes`);
            console.log(`   - GET  /api/incapacidades/activas`);
            console.log(`   - GET  /api/reclutamiento/vacantes`);
            console.log(`   - GET  /api/reclutamiento/pipeline`);
            console.log(`   - GET  /api/reclutamiento/aspirantes`);
            console.log(`   - GET  /api/reclutamiento/catalogos`);
            console.log('\n');
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();

export default app;
