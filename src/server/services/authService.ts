import { pool } from '../database/connection';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import crypto from 'crypto';
import { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rh-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export interface JwtPayload {
    usuarioId: number;
    empleadoId: number;
    perfilId: number;
    email: string;
}

export class AuthService {
    private static getTransporter() {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        });
    }

    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    }

    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static generateToken(payload: JwtPayload): string {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    }

    static verifyToken(token: string): JwtPayload | null {
        try {
            return jwt.verify(token, JWT_SECRET) as JwtPayload;
        } catch {
            return null;
        }
    }

    static generateCode(length = 8): string {
        return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
    }

    static async sendEmail(to: string, subject: string, html: string) {
        const transporter = this.getTransporter();
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"RH System" <noreply@rhsystem.com>',
                to,
                subject,
                html,
            });
            console.log(`📧 Email sent to ${to}: ${subject}`);
        } catch (error: any) {
            console.error('Email send error:', error.message);
            console.log(`📧 [DEV MODE] To: ${to}, Subject: ${subject}`);
            console.log(`📧 [DEV MODE] Body preview: ${html.substring(0, 200)}...`);
        }
    }

    static async registerFromInvitation(token: string, password: string): Promise<{ success: boolean; usuarioId?: number; error?: string }> {
        const client = await pool.connect();
        try {
            const inviteResult = await client.query(
                `SELECT * FROM invitaciones WHERE token = $1 AND usado = false AND expires_at > NOW()`,
                [token]
            );
            if (inviteResult.rows.length === 0) {
                return { success: false, error: 'Invitación inválida o expirada' };
            }
            const invitacion = inviteResult.rows[0];
            const email = invitacion.email;

            const empResult = await client.query(
                `SELECT id FROM empleados WHERE LOWER(email) = LOWER($1)`,
                [email]
            );
            if (empResult.rows.length === 0) {
                return { success: false, error: 'No se encontró empleado con ese correo' };
            }
            const empleadoId = empResult.rows[0].id;

            const passwordHash = await this.hashPassword(password);

            const result = await client.query(
                `INSERT INTO usuarios (empleado_id, email, password_hash, activo, must_change_password)
                 VALUES ($1, $2, $3, true, false)
                 ON CONFLICT (empleado_id) DO UPDATE SET
                   password_hash = $3, activo = true, must_change_password = false, updated_at = NOW()
                 RETURNING id`,
                [empleadoId, email, passwordHash]
            );

            await client.query(
                `UPDATE invitaciones SET usado = true, usado_en = NOW() WHERE id = $1`,
                [invitacion.id]
            );

            await client.release();
            return { success: true, usuarioId: result.rows[0].id };
        } catch (error: any) {
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    static async login(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string; mustChangePassword?: boolean }> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT u.*, e.perfil_id, e.estatus_usuario
                 FROM usuarios u
                 JOIN empleados e ON e.id = u.empleado_id
                 WHERE LOWER(u.email) = LOWER($1)`,
                [email]
            );

            if (result.rows.length === 0) {
                return { success: false, error: 'Credenciales inválidas' };
            }

            const usuario = result.rows[0];

            if (!usuario.activo) {
                return { success: false, error: 'Usuario desactivado. Contacta al administrador.' };
            }

            if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
                return { success: false, error: `Usuario bloqueado hasta ${new Date(usuario.bloqueado_hasta).toLocaleString()}` };
            }

            const passwordMatch = await this.verifyPassword(password, usuario.password_hash);
            if (!passwordMatch) {
                await client.query(
                    `UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1,
                     bloqueado_hasta = CASE WHEN intentos_fallidos >= 5 THEN NOW() + INTERVAL '30 minutes' ELSE bloqueado_hasta END
                     WHERE id = $1`,
                    [usuario.id]
                );
                return { success: false, error: 'Credenciales inválidas' };
            }

            await client.query(
                `UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW() WHERE id = $1`,
                [usuario.id]
            );

            const payload: JwtPayload = {
                usuarioId: usuario.id,
                empleadoId: usuario.empleado_id,
                perfilId: usuario.perfil_id,
                email: usuario.email,
            };
            const token = this.generateToken(payload);

            return { success: true, token, mustChangePassword: usuario.must_change_password };
        } finally {
            client.release();
        }
    }

    static async loginFace(datosBiometricos: string): Promise<{ success: boolean; token?: string; error?: string }> {
        const client = await pool.connect();
        try {
            const { default: asistenciaService } = await import('./asistenciaService');
            const identified = await asistenciaService.identifyFace(datosBiometricos);
            if (!identified) {
                return { success: false, error: 'Rostro no reconocido' };
            }

            const usuarioResult = await client.query(
                `SELECT u.*, e.perfil_id
                 FROM usuarios u
                 JOIN empleados e ON e.id = u.empleado_id
                 WHERE u.empleado_id = $1 AND u.activo = true`,
                [identified.empleadoId]
            );

            if (usuarioResult.rows.length === 0) {
                return { success: false, error: 'Empleado no tiene cuenta de usuario. Solicita invitación al administrador.' };
            }

            const usuario = usuarioResult.rows[0];
            await client.query(
                `UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1`,
                [usuario.id]
            );

            const payload: JwtPayload = {
                usuarioId: usuario.id,
                empleadoId: usuario.empleado_id,
                perfilId: usuario.perfil_id,
                email: usuario.email,
            };
            const token = this.generateToken(payload);

            return { success: true, token };
        } finally {
            client.release();
        }
    }

    static async getMe(token: string): Promise<{ success: boolean; data?: any; error?: string }> {
        const payload = this.verifyToken(token);
        if (!payload) {
            return { success: false, error: 'Token inválido o expirado' };
        }

        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT u.id as usuario_id, u.email, u.must_change_password,
                        e.id as empleado_id, e.numero_empleado, e.nombre, e.apellido_paterno,
                        e.apellido_materno, e.puesto, e.departamento, e.foto_url,
                        e.estatus_usuario,
                        p.clave as perfil_clave, p.nombre as perfil_nombre, p.es_administrador
                 FROM usuarios u
                 JOIN empleados e ON e.id = u.empleado_id
                 LEFT JOIN perfiles p ON p.id = e.perfil_id
                 WHERE u.id = $1 AND u.activo = true`,
                [payload.usuarioId]
            );

            if (result.rows.length === 0) {
                return { success: false, error: 'Usuario no encontrado' };
            }

            const user = result.rows[0];

            const accesosResult = await client.query(
                `SELECT a.clave
                 FROM perfil_accesos pa
                 JOIN accesos a ON a.id = pa.acceso_id
                 WHERE pa.perfil_id = $1 AND a.estatus = 'activo'`,
                [user.perfil_id]
            );
            const accessKeys = accesosResult.rows.map((r: any) => r.clave);

            return {
                success: true,
                data: {
                    usuarioId: user.usuario_id,
                    email: user.email,
                    mustChangePassword: user.must_change_password,
                    numeroEmpleado: user.numero_empleado,
                    nombre: `${user.nombre} ${user.apellido_paterno}`,
                    nombreCompleto: `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno || ''}`.trim(),
                    puesto: user.puesto,
                    departamento: user.departamento,
                    fotoUrl: user.foto_url,
                    perfilClave: user.perfil_clave,
                    perfilNombre: user.perfil_nombre,
                    esAdministrador: user.es_administrador,
                    estatusUsuario: user.estatus_usuario,
                    accessKeys,
                }
            };
        } finally {
            client.release();
        }
    }

    static async logout(tokenHash: string): Promise<void> {
        await pool.query(
            `UPDATE sesiones SET revoked = true, revoked_at = NOW() WHERE token_hash = $1`,
            [tokenHash]
        );
    }

    static async createInvitation(email: string, createdBy: number): Promise<{ success: boolean; token?: string; error?: string }> {
        const client = await pool.connect();
        try {
            const empResult = await client.query(
                `SELECT id, numero_empleado, nombre, apellido_paterno FROM empleados WHERE LOWER(email) = LOWER($1)`,
                [email]
            );
            if (empResult.rows.length === 0) {
                return { success: false, error: 'No se encontró empleado con ese correo' };
            }
            const empleado = empResult.rows[0];

            const usuarioResult = await client.query(
                `SELECT id, activo FROM usuarios WHERE empleado_id = $1`,
                [empleado.id]
            );
            if (usuarioResult.rows.length > 0 && usuarioResult.rows[0].activo) {
                return { success: false, error: 'El empleado ya tiene cuenta de usuario activa' };
            }

            const token = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await client.query(
                `INSERT INTO invitaciones (email, token, expires_at, created_by)
                 VALUES ($1, $2, $3, $4)`,
                [email, token, expiresAt, createdBy]
            );

            const link = `${BASE_URL}/auth/activar?token=${token}`;
            await this.sendEmail(
                email,
                'Invitación al sistema de RH',
                `<h2>¡Bienvenido/a ${empleado.nombre}!</h2>
                 <p>Has sido invitado/a al sistema de Recursos Humanos.</p>
                 <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
                 <p><a href="${link}">${link}</a></p>
                 <p>Este enlace expira en 7 días.</p>`
            );

            return { success: true, token };
        } finally {
            client.release();
        }
    }

    static async createResetCode(usuarioId: number, adminId: number): Promise<{ success: boolean; code?: string; error?: string }> {
        const client = await pool.connect();
        try {
            const userResult = await client.query(
                `SELECT u.id, u.email FROM usuarios u WHERE u.id = $1`,
                [usuarioId]
            );
            if (userResult.rows.length === 0) {
                return { success: false, error: 'Usuario no encontrado' };
            }

            const existing = await client.query(
                `SELECT id FROM reset_codigos WHERE usuario_id = $1 AND usado = false AND expires_at > NOW()`,
                [usuarioId]
            );
            if (existing.rows.length > 0) {
                await client.query(`UPDATE reset_codigos SET usado = true WHERE id = $1`, [existing.rows[0].id]);
            }

            const code = this.generateCode(8);
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

            await client.query(
                `INSERT INTO reset_codigos (usuario_id, codigo, expires_at, created_by)
                 VALUES ($1, $2, $3, $4)`,
                [usuarioId, code, expiresAt, adminId]
            );

            const user = userResult.rows[0];
            await this.sendEmail(
                user.email,
                'Código de recuperación de contraseña',
                `<h2>Recuperación de contraseña</h2>
                 <p>Tu código de recuperación es:</p>
                 <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
                 <p>Este código expira en 30 minutos.</p>
                 <p>Si no solicitaste este código, ignora este mensaje.</p>`
            );

            return { success: true, code };
        } finally {
            client.release();
        }
    }

    static async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
        const client = await pool.connect();
        try {
            const userResult = await client.query(
                `SELECT id, email FROM usuarios WHERE LOWER(email) = LOWER($1) AND activo = true`,
                [email]
            );
            if (userResult.rows.length === 0) {
                return { success: false, error: 'Si el correo existe, recibirás un enlace de recuperación' };
            }
            const usuario = userResult.rows[0];

            const token = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            await client.query(
                `INSERT INTO reset_password_tokens (email, token, expires_at)
                 VALUES ($1, $2, $3)`,
                [email, token, expiresAt]
            );

            const link = `${BASE_URL}/auth/reset-password?token=${token}`;
            await this.sendEmail(
                email,
                'Recuperación de contraseña',
                `<h2>Recuperación de contraseña</h2>
                 <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
                 <p><a href="${link}">${link}</a></p>
                 <p>Este enlace expira en 1 hora.</p>
                 <p>Si no solicitaste esto, ignora este mensaje.</p>`
            );

            return { success: true };
        } finally {
            client.release();
        }
    }

    static async resetPassword(token: string, codigo: string | null, newPassword: string): Promise<{ success: boolean; error?: string }> {
        const client = await pool.connect();
        try {
            if (token) {
                const tokenResult = await client.query(
                    `SELECT * FROM reset_password_tokens
                     WHERE token = $1 AND usado = false AND expires_at > NOW()`,
                    [token]
                );
                if (tokenResult.rows.length === 0) {
                    return { success: false, error: 'Token inválido o expirado' };
                }
                const resetToken = tokenResult.rows[0];

                const passwordHash = await this.hashPassword(newPassword);
                await client.query(
                    `UPDATE usuarios SET password_hash = $1, must_change_password = false,
                     updated_at = NOW() WHERE LOWER(email) = LOWER($2)`,
                    [passwordHash, resetToken.email]
                );
                await client.query(
                    `UPDATE reset_password_tokens SET usado = true, usado_en = NOW() WHERE id = $1`,
                    [resetToken.id]
                );
                return { success: true };
            }

            if (codigo) {
                const codeResult = await client.query(
                    `SELECT * FROM reset_codigos
                     WHERE codigo = $1 AND usado = false AND expires_at > NOW()`,
                    [codigo]
                );
                if (codeResult.rows.length === 0) {
                    return { success: false, error: 'Código inválido o expirado' };
                }
                const resetCode = codeResult.rows[0];

                const passwordHash = await this.hashPassword(newPassword);
                await client.query(
                    `UPDATE usuarios SET password_hash = $1, must_change_password = false,
                     updated_at = NOW() WHERE id = $2`,
                    [passwordHash, resetCode.usuario_id]
                );
                await client.query(
                    `UPDATE reset_codigos SET usado = true, usado_en = NOW() WHERE id = $1`,
                    [resetCode.id]
                );
                return { success: true };
            }

            return { success: false, error: 'Se requiere token o código' };
        } finally {
            client.release();
        }
    }

    static async changePassword(usuarioId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT password_hash FROM usuarios WHERE id = $1`,
                [usuarioId]
            );
            if (result.rows.length === 0) {
                return { success: false, error: 'Usuario no encontrado' };
            }

            const match = await this.verifyPassword(currentPassword, result.rows[0].password_hash);
            if (!match) {
                return { success: false, error: 'Contraseña actual incorrecta' };
            }

            const passwordHash = await this.hashPassword(newPassword);
            await client.query(
                `UPDATE usuarios SET password_hash = $1, must_change_password = false,
                 updated_at = NOW() WHERE id = $2`,
                [passwordHash, usuarioId]
            );

            return { success: true };
        } finally {
            client.release();
        }
    }

    static async getUsuarios(): Promise<any[]> {
        const result = await pool.query(
            `SELECT u.id, u.email, u.activo, u.must_change_password, u.ultimo_login,
                    e.id as empleado_id, e.numero_empleado, e.nombre, e.apellido_paterno,
                    p.clave as perfil_clave, p.nombre as perfil_nombre
             FROM usuarios u
             JOIN empleados e ON e.id = u.empleado_id
             LEFT JOIN perfiles p ON p.id = e.perfil_id
             ORDER BY e.apellido_paterno, e.nombre`
        );
        return result.rows;
    }

    static async getUsuarioById(id: number): Promise<any | null> {
        const result = await pool.query(
            `SELECT u.id, u.email, u.activo, u.must_change_password, u.ultimo_login,
                    e.id as empleado_id, e.numero_empleado, e.nombre, e.apellido_paterno,
                    p.clave as perfil_clave, p.nombre as perfil_nombre
             FROM usuarios u
             JOIN empleados e ON e.id = u.empleado_id
             LEFT JOIN perfiles p ON p.id = e.perfil_id
             WHERE u.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }
}

export default AuthService;
