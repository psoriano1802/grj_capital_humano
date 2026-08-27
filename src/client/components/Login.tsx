import React, { useState, useEffect } from 'react';
import { useSession } from '../services/SessionContext';
import BiometricAuth from './BiometricAuth';
import './Login.css';

interface LoginProps {
    onActivacion?: () => void;
    onRecuperacion?: () => void;
}

const Login: React.FC<LoginProps> = ({ onActivacion, onRecuperacion }) => {
    const { login, loginFace } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFace, setShowFace] = useState(false);
    const [mustChangePassword, setMustChangePassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (!result.success) {
            setError(result.error || 'Error desconocido');
        } else if (result.mustChangePassword) {
            setMustChangePassword(true);
        }
    };

    const handleFaceEnroll = async (datos: string) => {
        const result = await loginFace(datos);
        if (!result.success) {
            setError(result.error || 'Rostro no reconocido');
        }
    };

    if (mustChangePassword) {
        return (
            <ChangePassword initialEmail={email} onCancel={() => setMustChangePassword(false)} />
        );
    }

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
                            onMarcar={async (datos) => {
                                await handleFaceEnroll(datos);
                            }}
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

interface ChangePasswordProps {
    initialEmail?: string;
    onCancel?: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ initialEmail, onCancel }) => {
    const { login } = useSession();
    const [email, setEmail] = useState(initialEmail || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
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
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>✅</h1>
                        <p>Contraseña cambiada correctamente</p>
                    </div>
                    <p style={{ textAlign: 'center', color: 'var(--gray-400)' }}>
                        Ahora puedes ingresar con tu nueva contraseña.
                    </p>
                    <button className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '1rem' }} onClick={onCancel}>
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>🔑</h1>
                    <p>Cambia tu contraseña</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
                        Debes establecer una nueva contraseña para continuar
                    </p>
                </div>

                {error && (
                    <div className="login-error">
                        <span>❌</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    {initialEmail && (
                        <div className="form-group">
                            <label className="label">Correo</label>
                            <input type="email" className="input" value={email} disabled />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="label">Contraseña Actual</label>
                        <input
                            type="password"
                            className="input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Contraseña actual"
                            required
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
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la nueva contraseña"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%' }}>
                        {loading ? '⏳ Guardando...' : '💾 Guardar Contraseña'}
                    </button>

                    {onCancel && (
                        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={onCancel}>
                            Cancelar
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
