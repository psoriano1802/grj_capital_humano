import React, { useState, useEffect } from 'react';
import { useSession } from '../services/SessionContext';
import BiometricAuth from './BiometricAuth';
import './Login.css';

type AuthView = 'login' | 'activacion' | 'recuperacion' | 'cambiar-password';

interface AuthPageProps {
    initialView?: AuthView;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialView = 'login' }) => {
    const [view, setView] = useState<AuthView>(initialView);
    const [token, setToken] = useState<string>('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        const a = params.get('activar');

        if (a === '1' || window.location.pathname.includes('/auth/activar')) {
            setView('activacion');
            if (t) setToken(t);
        } else if (t && window.location.pathname.includes('/auth/reset-password')) {
            setView('recuperacion');
            setToken(t);
        }
    }, []);

    if (view === 'activacion') {
        return <ActivacionPage defaultToken={token} onBack={() => setView('login')} />;
    }
    if (view === 'recuperacion') {
        return <RecuperacionPage defaultToken={token} onBack={() => setView('login')} />;
    }
    if (view === 'cambiar-password') {
        return <CambiarPasswordPage onBack={() => setView('login')} />;
    }

    return <LoginPage
        onActivacion={() => setView('activacion')}
        onRecuperacion={() => setView('recuperacion')}
        onCambiarPassword={() => setView('cambiar-password')}
    />;
};

// ─── Login ────────────────────────────────────────────────────────────────
interface LoginPageProps {
    onActivacion: () => void;
    onRecuperacion: () => void;
    onCambiarPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onActivacion, onRecuperacion }) => {
    const { login, loginFace } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFace, setShowFace] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (!result.success) {
            setError(result.error || 'Error desconocido');
        }
    };

    const handleFaceLogin = async (datos: string) => {
        const result = await loginFace(datos);
        if (!result.success) {
            setError(result.error || 'Rostro no reconocido');
        }
    };

    if (showFace) {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>🏢 Sistema de RH</h1>
                        <p>Ingreso con Reconocimiento Facial</p>
                    </div>
                    <div style={{ maxWidth: 400, margin: '0 auto' }}>
                        <BiometricAuth
                            modo="marcar"
                            tipo="entrada"
                            onMarcar={handleFaceLogin}
                        />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button className="btn btn-secondary" onClick={() => setShowFace(false)}>
                            ← Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>🏢 Sistema de RH</h1>
                    <p>Ingresa tus credenciales para continuar</p>
                </div>

                {error && (
                    <div className="login-error">
                        <span>❌</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="label">Correo Electrónico</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu.correo@empresa.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Contraseña</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '⏳ Ingresando...' : '🔐 Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-divider">
                    <span>ó</span>
                </div>

                <button
                    className="btn btn-secondary btn-large"
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                    onClick={() => setShowFace(true)}
                >
                    😊 Ingresar con Face ID
                </button>

                <div className="login-links">
                    <button className="link-btn" onClick={onActivacion}>
                        📧 Activar cuenta (desde invitación)
                    </button>
                    <button className="link-btn" onClick={onRecuperacion}>
                        🔑 ¿Olvidaste tu contraseña?
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Activación (desde link de invitación) ─────────────────────────────
interface ActivacionPageProps {
    defaultToken?: string;
    onBack: () => void;
}

const ActivacionPage: React.FC<ActivacionPageProps> = ({ defaultToken = '', onBack }) => {
    const [token, setToken] = useState(defaultToken);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token.trim()) {
            setError('Token de invitación es requerido');
            return;
        }
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token.trim(), password }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Error al activar cuenta');
            }
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>✅</h1>
                        <p>¡Cuenta activada exitosamente!</p>
                    </div>
                    <p style={{ textAlign: 'center', color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                        Tu cuenta ha sido activada. Ahora puedes iniciar sesión con tu correo y contraseña.
                    </p>
                    <button className="btn btn-primary btn-large" style={{ width: '100%' }} onClick={onBack}>
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>📧 Activar Cuenta</h1>
                    <p>Ingresa tu correo y la nueva contraseña</p>
                </div>

                {error && <div className="auth-error"><span>❌</span> {error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="label">Token de Invitación</label>
                        <input
                            type="text"
                            className="input"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Pega el token del correo de invitación"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Nueva Contraseña</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Confirmar Contraseña</label>
                        <input
                            type="password"
                            className="input"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Repite la contraseña"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '⏳ Activando...' : '✅ Activar Cuenta'}
                    </button>

                    <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={onBack}>
                        ← Volver al Login
                    </button>
                </form>
            </div>
        </div>
    );
};

// ─── Recuperación de contraseña ─────────────────────────────────────────
interface RecuperacionPageProps {
    defaultToken?: string;
    onBack: () => void;
}

const RecuperacionPage: React.FC<RecuperacionPageProps> = ({ defaultToken = '', onBack }) => {
    const [token, setToken] = useState(defaultToken);
    const [codigo, setCodigo] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<'email' | 'reset'>(defaultToken ? 'reset' : 'email');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Error');
            }
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token.trim() && !codigo.trim()) {
            setError('Token o código es requerido');
            return;
        }
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token.trim() || undefined,
                    codigo: codigo.trim() || undefined,
                    password,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Error al restablecer contraseña');
            }
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    const [email, setEmail] = useState('');

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>📧</h1>
                        <p>Correo enviado</p>
                    </div>
                    <p style={{ textAlign: 'center', color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                        {step === 'email'
                            ? 'Si el correo existe, recibirás un enlace de recuperación.'
                            : 'Contraseña restablecida. Ya puedes iniciar sesión.'}
                    </p>
                    <button className="btn btn-primary btn-large" style={{ width: '100%' }} onClick={onBack}>
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🔑 Recuperar Contraseña</h1>
                    <p>{step === 'email' ? 'Ingresa tu correo para recibir el enlace' : 'Ingresa el código o usa el enlace'}</p>
                </div>

                {error && <div className="auth-error"><span>❌</span> {error}</div>}

                {step === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="label">Correo Electrónico</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu.correo@empresa.com"
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%' }}>
                            {loading ? '⏳ Enviando...' : '📧 Enviar Enlace'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetSubmit} className="auth-form">
                        {!token && (
                            <div className="form-group">
                                <label className="label">Código de Recuperación</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    placeholder="Código de 8 dígitos"
                                    maxLength={8}
                                />
                            </div>
                        )}
                        {token && (
                            <div className="auth-info">
                                Token de recuperación detectado. Ingresa tu nueva contraseña.
                            </div>
                        )}

                        <div className="form-group">
                            <label className="label">Nueva Contraseña</label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Confirmar Contraseña</label>
                            <input
                                type="password"
                                className="input"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Repite la contraseña"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%' }}>
                            {loading ? '⏳ Restableciendo...' : '🔑 Restablecer Contraseña'}
                        </button>
                    </form>
                )}

                <button className="auth-back" onClick={onBack}>
                    ← Volver al Login
                </button>
            </div>
        </div>
    );
};

// ─── Cambio de contraseña (sesión activa) ──────────────────────────────
interface CambiarPasswordPageProps {
    onBack: () => void;
}

const CambiarPasswordPage: React.FC<CambiarPasswordPageProps> = ({ onBack }) => {
    const { user, logout } = useSession();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (newPassword !== confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('rh_auth_token')}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Error al cambiar contraseña');
            }
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>✅</h1>
                        <p>Contraseña cambiada</p>
                    </div>
                    <p style={{ textAlign: 'center', color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                        Tu contraseña ha sido actualizada.
                    </p>
                    <button className="btn btn-primary btn-large" style={{ width: '100%' }} onClick={onBack}>
                        Continuar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🔑 Cambiar Contraseña</h1>
                    <p>Hola, {user?.nombre || 'Usuario'}</p>
                </div>

                {error && <div className="auth-error"><span>❌</span> {error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="label">Contraseña Actual</label>
                        <input
                            type="password"
                            className="input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Tu contraseña actual"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Nueva Contraseña</label>
                        <input
                            type="password"
                            className="input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            className="input"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Repite la nueva contraseña"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '⏳ Guardando...' : '💾 Guardar Contraseña'}
                    </button>

                    <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={logout}>
                        Cerrar Sesión
                    </button>

                    <button type="button" className="auth-back" onClick={onBack}>
                        Cancelar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;
