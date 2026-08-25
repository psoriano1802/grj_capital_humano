import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import BiometricoConfig from './components/BiometricoConfig';
import ReclutamientoModule from './components/Reclutamiento';
import OrganizacionModule from './components/Organizacion';
import EmpleadosModule from './components/Empleados';
import AsistenciasModule from './components/Asistencias';
import PermisosModule from './components/Permisos';
import VacacionesModule from './components/Vacaciones';
import IncapacidadesModule from './components/Incapacidades';
import ContratacionModule from './components/Contratacion';
import ConfiguracionModule from './components/Configuracion';
import { SessionProvider, SessionSelector, useSession } from './services/SessionContext';
import './App.css';

const AppContent: React.FC = () => {
    const { currentUser, loading, estatusUsuario, perfilAdmin, accessKeys, hasAccess } = useSession();
    const [activeMenu, setActiveMenu] = useState('registro-asistencia');
    const [empleadoDraft, setEmpleadoDraft] = useState<any>(null); // empleado creado desde aspirante para completar datos
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Conjunto de claves permitidas para el menu (undefined = ver todos, p.ej. admin/ sin perfil)
    const allowedKeys = !currentUser || perfilAdmin ? undefined : new Set<string>(accessKeys);
    const canViewMenu = !allowedKeys || allowedKeys.has(activeMenu);
    const isBlocked = estatusUsuario === 'inactivo';
    const isTempInactive = estatusUsuario === 'temporalmente_inactivo';

    const renderContent = () => {
        switch (activeMenu) {
            // ── RECLUTAMIENTO ────────────────────────────────────
            case 'pipeline-reclutamiento':
            case 'vacantes':
            case 'aspirantes':
            case 'catalogos-reclutamiento': {
                const tabMap: Record<string, 'pipeline' | 'vacantes' | 'aspirantes' | 'catalogos'> = {
                    'pipeline-reclutamiento': 'pipeline',
                    'vacantes':               'vacantes',
                    'aspirantes':             'aspirantes',
                    'catalogos-reclutamiento':'catalogos',
                };
                return (
                    <div className="content-section fade-in">
                        <ReclutamientoModule
                            initialTab={tabMap[activeMenu]}
                            onContratarAspirante={(emp) => {
                                setEmpleadoDraft(emp);
                                setActiveMenu('empleados');
                            }}
                        />
                    </div>
                );
            }

            // ── ORGANIZACIÓN ─────────────────────────────────────
            case 'organizacion':
            case 'org-sucursales':
            case 'org-departamentos':
            case 'org-puestos':
            case 'org-centros-costo':
            case 'org-organigrama':
            case 'org-ubicaciones': {
                type OrgTabType = 'resumen' | 'sucursales' | 'departamentos' | 'puestos' | 'centros-costo' | 'organigrama' | 'ubicaciones';
                const orgTabMap: Record<string, OrgTabType> = {
                    'organizacion':       'resumen',
                    'org-sucursales':     'sucursales',
                    'org-departamentos':  'departamentos',
                    'org-puestos':        'puestos',
                    'org-centros-costo':  'centros-costo',
                    'org-organigrama':    'organigrama',
                    'org-ubicaciones':    'ubicaciones',
                };
                return (
                    <div className="content-section fade-in">
                        <OrganizacionModule initialTab={orgTabMap[activeMenu]} />
                    </div>
                );
            }
            // ── EMPLEADOS ───────────────────────────────────────
            case 'empleados':
                return (
                    <div className="content-section fade-in">
                        <EmpleadosModule
                            prefillDraft={empleadoDraft}
                            onDraftUsed={() => setEmpleadoDraft(null)}
                        />
                    </div>
                );

            // ── ASISTENCIAS ───────────────────────────────────────
            case 'registro-asistencia':
            case 'reporte-asistencias':
                return (
                    <div className="content-section fade-in">
                        <AsistenciasModule initialTab={activeMenu === 'reporte-asistencias' ? 'reporte-asistencias' : 'registro-asistencia'} />
                    </div>
                );

            case 'configuracion-biometrico':
                return (
                    <div className="content-section fade-in">
                        <BiometricoConfig />
                    </div>
                );

            // ── PERMISOS ──────────────────────────────────────────
            case 'solicitar-permiso':
            case 'mis-permisos':
            case 'aprobar-permisos':
                return (
                    <div className="content-section fade-in">
                        <PermisosModule initialTab={activeMenu} />
                    </div>
                );

            // ── VACACIONES ────────────────────────────────────────
            case 'solicitar-vacaciones':
            case 'mis-vacaciones':
            case 'aprobar-vacaciones':
            case 'balance-vacaciones':
                return (
                    <div className="content-section fade-in">
                        <VacacionesModule initialTab={activeMenu} />
                    </div>
                );

            // ── INCAPACIDADES ──────────────────────────────────────
            case 'registrar-incapacidad':
            case 'mis-incapacidades':
            case 'incapacidades-activas':
                return (
                    <div className="content-section fade-in">
                        <IncapacidadesModule initialTab={activeMenu} />
                    </div>
                );

            // ── CONTRATACIÓN ──────────────────────────────────────
            case 'contratacion':
                return (
                    <div className="content-section fade-in">
                        <ContratacionModule />
                    </div>
                );

            // ── SEGURIDAD (perfiles / accesos / usuarios) ─────────
            case 'seguridad':
                return (
                    <div className="content-section fade-in">
                        {hasAccess('seguridad')
                            ? <ConfiguracionModule />
                            : (
                                <div className="card empty-state">
                                    <div className="empty-icon">🔒</div>
                                    <h3>Acceso restringido</h3>
                                    <p>No tienes permisos para configurar la seguridad.</p>
                                </div>
                            )}
                    </div>
                );

            default:
                return (
                    <div className="content-section fade-in">
                        <div className="section-header">
                            <h1>🚧 En Construcción</h1>
                            <p>Esta sección está en desarrollo</p>
                        </div>
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-icon">🔨</div>
                                <h3>Módulo en Desarrollo</h3>
                                <p>Esta funcionalidad estará disponible próximamente</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="app">
            <Sidebar
                onMenuSelect={setActiveMenu}
                activeMenu={activeMenu}
                allowedKeys={allowedKeys}
                currentUser={currentUser}
            />
            <main className="main-content">
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <SessionSelector />
                    </div>
                    {isTempInactive && !isBlocked && (
                        <div className="notification notification-info">
                            <span className="notification-icon">⚠️</span>
                            <span>Tu usuario está marcado como temporalmente inactivo. Contacta al administrador.</span>
                        </div>
                    )}
                    {notification && (
                        <div className={`notification notification-${notification.type}`}>
                            <span className="notification-icon">
                                {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
                            </span>
                            <span>{notification.message}</span>
                            <button className="notification-close" onClick={() => setNotification(null)}>
                                ✕
                            </button>
                        </div>
                    )}
                    {loading ? (
                        <div className="card empty-state">
                            <div className="empty-icon">⏳</div>
                            <h3>Cargando sesión...</h3>
                        </div>
                    ) : isBlocked ? (
                        <div className="card empty-state">
                            <div className="empty-icon">🔒</div>
                            <h3>Usuario sin acceso</h3>
                            <p>Tu usuario está inactivo. Contacta al administrador para habilitar tu acceso.</p>
                        </div>
                    ) : canViewMenu ? (
                        renderContent()
                    ) : (
                        <div className="card empty-state">
                            <div className="empty-icon">🔒</div>
                            <h3>Acceso restringido</h3>
                            <p>No tienes permisos para ver este módulo.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => (
    <SessionProvider>
        <AppContent />
    </SessionProvider>
);

export default App;
