import React, { useState, useEffect, useCallback } from 'react';
import './Contratacion.css';

// ── Definición de los catálogos y sus claves ─────────────────
const CATALOGS = [
    { id: 'tipos_contratacion', label: 'Tipos de contratación', icon: '📝' },
    { id: 'tipos_empleado', label: 'Tipos de empleado', icon: '👥' },
    { id: 'tipos_jornada', label: 'Tipos de jornada', icon: '☀️' },
    { id: 'turnos', label: 'Turnos', icon: '🔄' },
    { id: 'horarios_laborales', label: 'Horarios laborales', icon: '⏰' },
    { id: 'politicas_descanso', label: 'Comida / Descanso', icon: '☕' },
    { id: 'calendarios_laborales', label: 'Calendarios laborales', icon: '📅' },
    { id: 'prestaciones', label: 'Prestaciones', icon: '🎁' },
    { id: 'esquemas_pago', label: 'Esquemas de pago', icon: '💵' },
    { id: 'tipos_contrato', label: 'Tipos de contrato', icon: '📜' },
];

const fetchApi = async (url: string, options?: RequestInit) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("API Error", e);
        return { success: false, data: [] };
    }
};

const ContratacionModule: React.FC = () => {
    const [activeCatalog, setActiveCatalog] = useState(CATALOGS[0].id);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ nombre: '', descripcion: '' });

    const loadData = useCallback(async () => {
        setLoading(true);
        const res = await fetchApi(`/api/contratacion/catalogos/${activeCatalog}`);
        if (res.success && Array.isArray(res.data)) {
            setData(res.data);
        } else {
            setData([]);
        }
        setLoading(false);
    }, [activeCatalog]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetchApi(`/api/contratacion/catalogos/${activeCatalog}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        
        if (res.success) {
            setShowModal(false);
            setForm({ nombre: '', descripcion: '' });
            loadData();
        } else {
            alert(`Error al guardar el elemento: ${res.error || 'Nombre duplicado o inválido'}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este elemento?')) return;
        const res = await fetchApi(`/api/contratacion/catalogos/${activeCatalog}/${id}`, { method: 'DELETE' });
        if (res.success) {
            loadData();
        } else {
            alert('Error al eliminar');
        }
    };

    const currentCatalogInfo = CATALOGS.find(c => c.id === activeCatalog);

    return (
        <div className="contratacion-container">
            <div className="contratacion-header">
                <div className="contratacion-title">
                    <h1>🤝 Módulo de Contratación</h1>
                    <p>Gestión de catálogos y esquemas contractuales</p>
                </div>
            </div>

            <div className="contratacion-layout">
                {/* Menú lateral de catálogos */}
                <div className="catalog-menu">
                    <div className="catalog-menu-title">Catálogos Disponibles</div>
                    <ul className="catalog-menu-list">
                        {CATALOGS.map(cat => (
                            <li 
                                key={cat.id} 
                                className={`catalog-menu-item ${activeCatalog === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCatalog(cat.id)}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contenido principal del catálogo seleccionado */}
                <div className="catalog-content">
                    <div className="catalog-content-header">
                        <h2>{currentCatalogInfo?.icon} {currentCatalogInfo?.label}</h2>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            ➕ Nuevo Elemento
                        </button>
                    </div>

                    {loading ? (
                        <div className="ct-loading">⏳ Cargando datos...</div>
                    ) : data.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-icon">📂</div>
                            <h3>Catálogo Vacío</h3>
                            <p>No hay elementos registrados en este catálogo aún.</p>
                        </div>
                    ) : (
                        <div className="catalog-table-container">
                            <table className="ct-table">
                                <thead>
                                    <tr>
                                        <th>Nombre / Valor</th>
                                        <th>Descripción</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item) => (
                                        <tr key={item.id}>
                                            <td><strong>{item.nombre}</strong></td>
                                            <td className="ct-desc">{item.descripcion || '-'}</td>
                                            <td>
                                                <span className="ct-badge">Activo</span>
                                            </td>
                                            <td>
                                                <div className="ct-actions">
                                                    <button 
                                                        className="ct-btn-delete" 
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Eliminar"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para Crear Nuevo Elemento */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <div className="modal-title">➕ Nuevo elemento en {currentCatalogInfo?.label}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form className="form" onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="label">Nombre o Valor *</label>
                                <input 
                                    className="input" 
                                    required 
                                    value={form.nombre} 
                                    onChange={e => setForm({...form, nombre: e.target.value})} 
                                    placeholder="Ej: Temporal, Vespertino, etc..." 
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Descripción</label>
                                <textarea 
                                    className="input" 
                                    rows={3} 
                                    value={form.descripcion} 
                                    onChange={e => setForm({...form, descripcion: e.target.value})} 
                                    placeholder="Breve descripción del elemento..." 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>💾 Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContratacionModule;
