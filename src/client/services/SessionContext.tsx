import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const TOKEN_KEY = 'rh_auth_token';

interface AuthUser {
    usuarioId: number;
    email: string;
    mustChangePassword: boolean;
    numeroEmpleado: string;
    nombre: string;
    nombreCompleto: string;
    puesto: string | null;
    departamento: string | null;
    fotoUrl: string | null;
    perfilClave: string | null;
    perfilNombre: string | null;
    esAdministrador: boolean;
    estatusUsuario: string;
    accessKeys: string[];
}

interface SessionState {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
    loginFace: (datos: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    reloadUser: () => Promise<void>;
    hasAccess: (clave: string) => boolean;
}

const SessionContext = createContext<SessionState>({
    user: null,
    token: null,
    loading: true,
    isAuthenticated: false,
    login: async () => ({ success: false, error: 'No inicializado' }),
    loginFace: async () => ({ success: false, error: 'No inicializado' }),
    logout: () => {},
    reloadUser: async () => {},
    hasAccess: () => false,
});

export const SessionProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUserFromToken = useCallback(async (authToken: string): Promise<AuthUser | null> => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const data = await res.json();
            if (data.success && data.data) {
                return data.data as AuthUser;
            }
            return null;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        (async () => {
            const savedToken = localStorage.getItem(TOKEN_KEY);
            if (savedToken) {
                const u = await loadUserFromToken(savedToken);
                if (u) {
                    setToken(savedToken);
                    setUser(u);
                } else {
                    localStorage.removeItem(TOKEN_KEY);
                }
            }
            setLoading(false);
        })();
    }, [loadUserFromToken]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success && data.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
                setToken(data.token);
                const u = await loadUserFromToken(data.token);
                setUser(u);
                return { success: true, mustChangePassword: data.mustChangePassword };
            }
            return { success: false, error: data.error || 'Error en login' };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }, [loadUserFromToken]);

    const loginFace = useCallback(async (datos: string) => {
        try {
            const res = await fetch('/api/auth/login-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ datos_biometricos: datos }),
            });
            const data = await res.json();
            if (data.success && data.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
                setToken(data.token);
                const u = await loadUserFromToken(data.token);
                setUser(u);
                return { success: true };
            }
            return { success: false, error: data.error || 'Error en login' };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }, [loadUserFromToken]);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const reloadUser = useCallback(async () => {
        if (!token) return;
        const u = await loadUserFromToken(token);
        if (u) setUser(u);
        else logout();
    }, [token, loadUserFromToken, logout]);

    const hasAccess = useCallback(
        (clave: string) => {
            if (!user) return false;
            if (user.esAdministrador) return true;
            return user.accessKeys.includes(clave);
        },
        [user]
    );

    return (
        <SessionContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: !!user && !!token,
                login,
                loginFace,
                logout,
                reloadUser,
                hasAccess,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
