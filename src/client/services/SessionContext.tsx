import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'rh_current_user';

interface SessionState {
    currentUser: any | null;
    empleados: any[];
    loading: boolean;
    accessKeys: string[];          // claves de los modulos a los que tiene acceso el usuario activo
    estatusUsuario: string | null; // 'activo' | 'inactivo' | 'temporalmente_inactivo'
    perfilAdmin: boolean;
    setCurrentUser: (emp: any) => void;
    reloadCurrentUser: () => Promise<void>;
    hasAccess: (clave: string) => boolean;
}

const SessionContext = createContext<SessionState>({
    currentUser: null,
    empleados: [],
    loading: true,
    accessKeys: [],
    estatusUsuario: null,
    perfilAdmin: false,
    setCurrentUser: () => {},
    reloadCurrentUser: async () => {},
    hasAccess: () => false,
});

export const SessionProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [currentUser, setCurrentUserState] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessKeys, setAccessKeys] = useState<string[]>([]);
    const [estatusUsuario, setEstatusUsuario] = useState<string | null>(null);
    const [perfilAdmin, setPerfilAdmin] = useState(false);

    // Cargar lista de empleados y restablecer identidad desde localStorage
    const cargarLista = useCallback(async (): Promise<any[]> => {
        const res = await fetch('/api/empleados');
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : [];
        setEmpleados(list);
        return list;
    }, []);

    // Resolver accesos del usuario activo
    const cargarAccesos = useCallback(async (id: number) => {
        try {
            const res = await fetch(`/api/seguridad/usuarios/${id}/accesos`);
            const data = await res.json();
            if (data.success && data.data) {
                const lista = Array.isArray(data.data.accesos) ? data.data.accesos : [];
                setAccessKeys(lista.map((a: any) => a.clave));
                setEstatusUsuario(data.data.estatus_usuario ?? 'activo');
                setPerfilAdmin(!!data.data.es_administrador);
            }
        } catch {
            setAccessKeys([]);
            setEstatusUsuario('activo');
            setPerfilAdmin(false);
        }
    }, []);

    // Carga inicial
    useEffect(() => {
        (async () => {
            try {
                const list = await cargarLista();

                let user: any = null;
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try { user = JSON.parse(saved); } catch { user = null; }
                }
                if (!user || !list.some((e: any) => e.id === user.id)) {
                    user = list[0] || null;
                }
                setCurrentUserState(user);
                if (user) await cargarAccesos(user.id);
            } catch {
                setCurrentUserState(null);
            }
            setLoading(false);
        })();
    }, [cargarLista, cargarAccesos]);

    // Re-resolver accesos cuando cambia la identidad
    useEffect(() => {
        if (!currentUser) {
            setAccessKeys([]);
            setEstatusUsuario(null);
            setPerfilAdmin(false);
            return;
        }
        cargarAccesos(currentUser.id);
    }, [currentUser, cargarAccesos]);

    const setCurrentUser = (emp: any) => {
        setCurrentUserState(emp);
        if (emp) localStorage.setItem(STORAGE_KEY, JSON.stringify(emp));
        else localStorage.removeItem(STORAGE_KEY);
    };

    // Recargar la identidad activa (para reflejar cambios de perfil/estatus)
    const reloadCurrentUser = useCallback(async () => {
        if (!currentUser) return;
        try {
            const list = await cargarLista();
            const refreshed = list.find((e: any) => e.id === currentUser.id) || currentUser;
            setCurrentUserState({ ...currentUser, ...refreshed });
            await cargarAccesos(currentUser.id);
        } catch {
            /* noop */
        }
    }, [currentUser, cargarLista, cargarAccesos]);

    const hasAccess = useCallback(
        (clave: string) => perfilAdmin || accessKeys.includes(clave),
        [perfilAdmin, accessKeys]
    );

    return (
        <SessionContext.Provider
            value={{
                currentUser,
                empleados,
                loading,
                accessKeys,
                estatusUsuario,
                perfilAdmin,
                setCurrentUser,
                reloadCurrentUser,
                hasAccess,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);

// Selector de identidad activa (solicitante/aprobador) usado en la barra superior
export const SessionSelector: React.FC = () => {
    const { currentUser, empleados, loading, setCurrentUser } = useSession();
    if (loading) return <span style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>⏳ Identificando usuario…</span>;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
                👤 Identidad activa{currentUser?.perfil_clave ? ` (${currentUser.perfil_clave})` : ''}:
            </span>
            <select
                value={currentUser?.id ?? ''}
                onChange={(e) => {
                    const emp = empleados.find((x: any) => String(x.id) === e.target.value);
                    if (emp) setCurrentUser(emp);
                }}
                style={{ background: 'transparent', color: 'var(--gray-100)', border: 'none', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
            >
                {empleados.map((e: any) => (
                    <option key={e.id} value={e.id} style={{ color: '#111', background: '#fff' }}>
                        {e.nombre} {e.apellido_paterno} {e.apellido_materno} — #{e.numero_empleado} ({e.perfil_clave || 'sin perfil'})
                    </option>
                ))}
            </select>
        </div>
    );
};