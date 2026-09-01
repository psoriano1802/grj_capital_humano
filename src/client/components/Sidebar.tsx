import React, { useState } from 'react';
import './Sidebar.css';

interface MenuItem {
    id: string;
    label: string;
    icon: string;
    children?: MenuItem[];
}

interface SidebarProps {
    onMenuSelect: (menuId: string) => void;
    activeMenu: string;
    allowedKeys?: Set<string>;
    currentUser?: any;
    isOpen?: boolean;
    onClose?: () => void;
}

const menuItems: MenuItem[] = [
    {
        id: 'reclutamiento',
        label: 'Reclutamiento',
        icon: '🎯',
        children: [
            { id: 'pipeline-reclutamiento', label: 'Pipeline',        icon: '🔄' },
            { id: 'vacantes',               label: 'Vacantes',        icon: '📋' },
            { id: 'aspirantes',             label: 'Aspirantes',      icon: '👤' },
            { id: 'catalogos-reclutamiento',label: 'Catálogos',       icon: '📚' },
        ]
    },
    {
        id: 'recursos-humanos',
        label: 'Recursos humanos',
        icon: '👥',
        children: [
            { id: 'empleados',         label: 'Empleados',    icon: '👔' },
            { id: 'organizacion',      label: 'Organización', icon: '🏢' },
            { id: 'org-sucursales',    label: 'Sucursales',   icon: '🏭' },
            { id: 'org-departamentos', label: 'Departamentos',icon: '🗂️' },
            { id: 'org-puestos',       label: 'Puestos',      icon: '💼' },
            { id: 'org-centros-costo', label: 'Centros de Costo', icon: '💰' },
            { id: 'org-organigrama',   label: 'Organigrama',  icon: '🌲' },
            { id: 'org-ubicaciones',   label: 'Ubicaciones',  icon: '📍' },
            { id: 'contratacion',      label: 'Contratación', icon: '🤝' },
            // 👇 NÓMINA — descomenta cuando se implemente el módulo de nómina
            // { id: 'nomina',            label: 'Nómina',       icon: '💵' },
            { id: 'control-cvs',       label: 'Control de CVs', icon: '📄' },
        ]
    },
    {
        id: 'asistencias',
        label: 'Asistencias',
        icon: '⏰',
        children: [
            { id: 'registro-asistencia', label: 'Registro de Asistencia', icon: '✓' },
            { id: 'reporte-asistencias', label: 'Reporte de Asistencias', icon: '📊' },
            { id: 'configuracion-biometrico', label: 'Configuración Biométrica', icon: '🔐' }
        ]
    },
    {
        id: 'permisos',
        label: 'Permisos',
        icon: '📝',
        children: [
            { id: 'solicitar-permiso', label: 'Solicitar Permiso', icon: '➕' },
            { id: 'mis-permisos', label: 'Mis Permisos', icon: '📋' },
            { id: 'aprobar-permisos', label: 'Aprobar Permisos', icon: '✅' }
        ]
    },
    {
        id: 'vacaciones',
        label: 'Vacaciones',
        icon: '🏖️',
        children: [
            { id: 'solicitar-vacaciones', label: 'Solicitar Vacaciones', icon: '➕' },
            { id: 'mis-vacaciones', label: 'Mis Vacaciones', icon: '📅' },
            { id: 'aprobar-vacaciones', label: 'Aprobar Vacaciones', icon: '✅' },
            { id: 'balance-vacaciones', label: 'Balance de Vacaciones', icon: '📊' }
        ]
    },
    {
        id: 'incapacidades',
        label: 'Incapacidades',
        icon: '🏥',
        children: [
            { id: 'registrar-incapacidad', label: 'Registrar Incapacidad', icon: '➕' },
            { id: 'mis-incapacidades', label: 'Mis Incapacidades', icon: '📋' },
            { id: 'incapacidades-activas', label: 'Incapacidades Activas', icon: '🔴' }
        ]
    },
    {
        id: 'seguridad',
        label: 'Seguridad',
        icon: '🛡️',
        children: [
            { id: 'seguridad', label: 'Configuración de Seguridad', icon: '⚙️' }
        ]
    }
];

const Sidebar: React.FC<SidebarProps> = ({ onMenuSelect, activeMenu, allowedKeys, currentUser, isOpen, onClose }) => {
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['recursos-humanos']);

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId]
        );
    };

    // Filtrar menus por accesos del usuario
    const visibleMenus = allowedKeys
        ? menuItems
              .map(item => {
                  if (!item.children) return allowedKeys.has(item.id) ? item : null;
                  const children = item.children.filter(c => allowedKeys.has(c.id));
                  if (children.length === 0) return null;
                  return { ...item, children };
              })
              .filter(Boolean) as MenuItem[]
        : menuItems;

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <img src="/rh-icon.svg" alt="RH" style={{ width: 28, height: 28, borderRadius: 6 }} />
                        <h1 className="logo-text">Sistema RH</h1>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {visibleMenus.map(item => (
                        <div key={item.id} className="menu-section">
                            <button
                                className={`menu-item ${expandedMenus.includes(item.id) ? 'expanded' : ''}`}
                                onClick={() => toggleMenu(item.id)}
                            >
                                <span className="menu-icon">{item.icon}</span>
                                <span className="menu-label">{item.label}</span>
                                {item.children && (
                                    <span className="menu-arrow">
                                        {expandedMenus.includes(item.id) ? '▼' : '▶'}
                                    </span>
                                )}
                            </button>

                            {item.children && expandedMenus.includes(item.id) && (
                                <div className="submenu">
                                    {item.children.map(child => (
                                        <button
                                            key={child.id}
                                            className={`submenu-item ${activeMenu === child.id ? 'active' : ''}`}
                                            onClick={() => { onMenuSelect(child.id); if (onClose) onClose(); }}
                                        >
                                            <span className="submenu-icon">{child.icon}</span>
                                            <span className="submenu-label">{child.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">👤</div>
                        <div className="user-details">
                            <div className="user-name">
                                {currentUser
                                    ? `${currentUser.nombre} ${currentUser.apellido_paterno}`
                                    : 'Usuario'}
                            </div>
                            <div className="user-role">{currentUser?.perfil_nombre || currentUser?.perfil_clave || 'Sin perfil'}</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
