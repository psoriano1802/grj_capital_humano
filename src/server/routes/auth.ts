import { Router, Request, Response } from 'express';
import AuthService from '../services/authService';
import { pool } from '../database/connection';

const router = Router();

const authenticate = async (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Token requerido' });
    }
    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    if (!payload) {
        return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
    }
    (req as any).auth = payload;
    next();
};

const requireAdmin = async (req: Request, res: Response, next: Function) => {
    const auth = (req as any).auth;
    if (!auth) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    if (auth.perfilId) {
        const result = await pool.query(`SELECT es_administrador FROM perfiles WHERE id = $1`, [auth.perfilId]);
        if (result.rows[0]?.es_administrador !== true) {
            return res.status(403).json({ success: false, error: 'Solo administradores pueden realizar esta acción' });
        }
    } else {
        return res.status(403).json({ success: false, error: 'Sin permisos' });
    }
    next();
};

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email y contraseña son requeridos' });
        }
        const result = await AuthService.login(email, password);
        if (!result.success) {
            return res.status(401).json({ success: false, error: result.error });
        }
        res.json({ success: true, token: result.token, mustChangePassword: result.mustChangePassword });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/login-face', async (req: Request, res: Response) => {
    try {
        const { datos_biometricos } = req.body;
        if (!datos_biometricos) {
            return res.status(400).json({ success: false, error: 'Datos biométricos requeridos' });
        }
        const result = await AuthService.loginFace(datos_biometricos);
        if (!result.success) {
            return res.status(401).json({ success: false, error: result.error });
        }
        res.json({ success: true, token: result.token });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, error: 'Token y contraseña son requeridos' });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
        }
        const result = await AuthService.registerFromInvitation(token, password);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.status(201).json({ success: true, message: 'Cuenta activada correctamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email es requerido' });
        }
        const result = await AuthService.forgotPassword(email);
        res.json({ success: true, message: 'Si el correo existe, recibirás un enlace de recuperación' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, codigo, password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, error: 'Nueva contraseña es requerida' });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
        }
        const result = await AuthService.resetPassword(token || null, codigo || null, password);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, message: 'Contraseña restablecida correctamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/change-password', authenticate, async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const auth = (req as any).auth;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Contraseña actual y nueva son requeridas' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' });
        }
        const result = await AuthService.changePassword(auth.usuarioId, currentPassword, newPassword);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, message: 'Contraseña cambiada correctamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization!;
        const token = authHeader.substring(7);
        const result = await AuthService.getMe(token);
        if (!result.success) {
            return res.status(401).json({ success: false, error: result.error });
        }
        res.json({ success: true, data: result.data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/usuarios', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const usuarios = await AuthService.getUsuarios();
        res.json({ success: true, data: usuarios });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/usuarios/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const usuario = await AuthService.getUsuarioById(parseInt(req.params.id));
        if (!usuario) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }
        res.json({ success: true, data: usuario });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/invitar', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email es requerido' });
        }
        const auth = (req as any).auth;
        const result = await AuthService.createInvitation(email, auth.empleadoId);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, message: 'Invitación enviada', token: result.token });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/generar-codigo', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { usuario_id } = req.body;
        if (!usuario_id) {
            return res.status(400).json({ success: false, error: 'usuario_id es requerido' });
        }
        const auth = (req as any).auth;
        const result = await AuthService.createResetCode(parseInt(usuario_id), auth.empleadoId);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }
        res.json({ success: true, message: 'Código generado y enviado por email', codigo: result.code });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
