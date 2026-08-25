import React, { useState, useEffect, useCallback } from 'react';
import './Organizacion.css';

// ── API helper ───────────────────────────────────────────────
const BASE = '/api/organizacion';
const apiFetch = async (path: string, opts?: RequestInit) => {
    try {
        const isFormData = opts?.body instanceof FormData;
        const res = await fetch(`${BASE}${path}`, {
            headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
            ...opts,
        });
        const json = await res.json();
        if (!res.ok) return { success: false, error: json.error ?? `Error ${res.status}`, data: null };
        return json;
    } catch {
        return { success: false, error: 'Sin conexión con el servidor', data: null };
    }
};

// ── Subcomponents ────────────────────────────────────────────

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => (
    <div className="org-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className={`org-modal ${wide ? 'org-modal-wide' : ''}`}>
            <div className="org-modal-header">
                <span className="org-modal-title">{title}</span>
                <button className="org-btn-icon" onClick={onClose}>✕</button>
            </div>
            <div className="org-modal-body">
                {children}
            </div>
        </div>
    </div>
);

const Badge: React.FC<{ text: string; color?: 'blue' | 'green' | 'purple' | 'orange' | 'gray' }> = ({ text, color = 'blue' }) => (
    <span className={`org-badge org-badge-${color}`}>{text}</span>
);

const StatCard: React.FC<{ icon: string; label: string; value: number | string; color: string }> = ({ icon, label, value, color }) => (
    <div className="org-stat-card" style={{ borderTopColor: color }}>
        <div className="org-stat-icon">{icon}</div>
        <div className="org-stat-value" style={{ color }}>{value}</div>
        <div className="org-stat-label">{label}</div>
    </div>
);

// ─────────────────────────────────────────────────────────────
// SECCIÓN: RESUMEN
// ─────────────────────────────────────────────────────────────
const ResumenView: React.FC = () => {
    const [data, setData] = useState<any>(null);
    useEffect(() => { apiFetch('/resumen').then(r => r.success && setData(r.data)); }, []);

    return (
        <div>
            <div className="org-section-header">
                <h1>🏢 Organización</h1>
                <p>Estructura organizacional de la empresa · centros de trabajo, áreas, puestos y ubicaciones</p>
            </div>
            <div className="org-stats-row">
                <StatCard icon="🏢" label="Sucursales" value={data?.sucursales ?? '…'} color="#0ea5e9" />
                <StatCard icon="🗂️" label="Departamentos" value={data?.departamentos ?? '…'} color="#8b5cf6" />
                <StatCard icon="💼" label="Puestos" value={data?.puestos ?? '…'} color="#10b981" />
                <StatCard icon="💰" label="Centros de Costo" value={data?.centros_costo ?? '…'} color="#f59e0b" />
                <StatCard icon="📍" label="Ubicaciones" value={data?.ubicaciones ?? '…'} color="#ec4899" />
            </div>

            <div className="org-info-grid">
                <div className="org-info-card">
                    <div className="org-info-icon">🏢</div>
                    <div>
                        <div className="org-info-title">Sucursales</div>
                        <div className="org-info-desc">Centros de trabajo, plantas, tiendas y almacenes</div>
                    </div>
                </div>
                <div className="org-info-card">
                    <div className="org-info-icon">🗂️</div>
                    <div>
                        <div className="org-info-title">Departamentos</div>
                        <div className="org-info-desc">Agrupación funcional del personal por áreas</div>
                    </div>
                </div>
                <div className="org-info-card">
                    <div className="org-info-icon">💼</div>
                    <div>
                        <div className="org-info-title">Puestos</div>
                        <div className="org-info-desc">Catálogo de puestos autorizados con niveles y rangos salariales</div>
                    </div>
                </div>
                <div className="org-info-card">
                    <div className="org-info-icon">🌲</div>
                    <div>
                        <div className="org-info-title">Organigrama</div>
                        <div className="org-info-desc">Jerarquía y relación jefe-subordinado entre puestos</div>
                    </div>
                </div>
                <div className="org-info-card">
                    <div className="org-info-icon">💰</div>
                    <div>
                        <div className="org-info-title">Centros de Costo</div>
                        <div className="org-info-desc">Claves contables para clasificación presupuestal</div>
                    </div>
                </div>
                <div className="org-info-card">
                    <div className="org-info-icon">📍</div>
                    <div>
                        <div className="org-info-title">Ubicaciones Físicas</div>
                        <div className="org-info-desc">Oficinas, plantas, almacenes y salas dentro de cada sucursal</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// SECCIÓN: SUCURSALES
// ─────────────────────────────────────────────────────────────
const TIPO_SUCURSAL_COLORS: Record<string, string> = {
    MATRIZ: 'blue', PLANTA: 'green', TIENDA: 'purple', ALMACEN: 'orange', SUCURSAL: 'gray'
};

const SucursalesView: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ clave: '', nombre: '', tipo: 'SUCURSAL', ciudad: '', estado: '', responsable: '', telefono: '', direccion: '' });

    const load = useCallback(() => {
        apiFetch('/sucursales').then(r => { if (r.success) setRows(r.data); setLoading(false); });
    }, []);
    useEffect(() => { load(); }, [load]);

    const openNew = () => { setEditing(null); setForm({ clave: '', nombre: '', tipo: 'SUCURSAL', ciudad: '', estado: '', responsable: '', telefono: '', direccion: '' }); setShowForm(true); };
    const openEdit = (r: any) => { setEditing(r); setForm(r); setShowForm(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = editing
            ? await apiFetch(`/sucursales/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...form, activo: true }) })
            : await apiFetch('/sucursales', { method: 'POST', body: JSON.stringify(form) });
        if (r.success) { setShowForm(false); load(); }
    };

    const toggleActivo = async (row: any) => {
        await apiFetch(`/sucursales/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...row, activo: !row.activo }) });
        load();
    };

    if (loading) return <div className="org-loading">⏳ Cargando sucursales…</div>;

    return (
        <div>
            <div className="org-view-header">
                <div>
                    <h2 className="org-view-title">🏢 Sucursales</h2>
                    <p className="org-view-sub">Centros de trabajo, plantas, tiendas y almacenes ({rows.length})</p>
                </div>
                <button className="org-btn org-btn-primary" onClick={openNew}>➕ Nueva Sucursal</button>
            </div>

            <div className="org-cards-grid">
                {rows.map(r => (
                    <div key={r.id} className={`org-entity-card ${!r.activo ? 'org-entity-card-inactive' : ''}`}>
                        <div className="org-entity-card-top">
                            <div className="org-entity-icon-wrap">
                                {r.tipo === 'MATRIZ' ? '🏛️' : r.tipo === 'PLANTA' ? '🏭' : r.tipo === 'TIENDA' ? '🏪' : r.tipo === 'ALMACEN' ? '📦' : '🏢'}
                            </div>
                            <div className="org-entity-info">
                                <div className="org-entity-name">{r.nombre}</div>
                                <div className="org-entity-clave">{r.clave}</div>
                            </div>
                            <Badge text={r.tipo} color={(TIPO_SUCURSAL_COLORS[r.tipo] ?? 'gray') as any} />
                        </div>
                        <div className="org-entity-meta">
                            {r.ciudad && <span>📍 {r.ciudad}, {r.estado}</span>}
                            {r.responsable && <span>👤 {r.responsable}</span>}
                            {r.total_departamentos > 0 && <span>🗂️ {r.total_departamentos} dept.</span>}
                        </div>
                        <div className="org-entity-actions">
                            <button className="org-btn org-btn-sm org-btn-secondary" onClick={() => openEdit(r)}>✏️ Editar</button>
                            <button className={`org-btn org-btn-sm ${r.activo ? 'org-btn-ghost' : 'org-btn-success'}`} onClick={() => toggleActivo(r)}>
                                {r.activo ? '🔒 Desactivar' : '✅ Activar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <Modal title={editing ? '✏️ Editar Sucursal' : '🏢 Nueva Sucursal'} onClose={() => setShowForm(false)}>
                    <form className="org-form" onSubmit={handleSubmit}>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Clave *</label>
                                <input className="org-input" required value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value.toUpperCase() })} placeholder="MATRIZ, PLANTA1…" disabled={!!editing} />
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Tipo *</label>
                                <select className="org-input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                                    {['MATRIZ', 'SUCURSAL', 'PLANTA', 'TIENDA', 'ALMACEN'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Nombre *</label>
                            <input className="org-input" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo de la sucursal" />
                        </div>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Ciudad</label>
                                <input className="org-input" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} placeholder="Ciudad de México" />
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Estado</label>
                                <input className="org-input" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} placeholder="CDMX" />
                            </div>
                        </div>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Responsable</label>
                                <input className="org-input" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} placeholder="Nombre del responsable" />
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Teléfono</label>
                                <input className="org-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="55 0000 0000" />
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Dirección</label>
                            <input className="org-input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Calle, número, colonia…" />
                        </div>
                        <div className="org-form-actions">
                            <button type="submit" className="org-btn org-btn-primary org-btn-block">💾 {editing ? 'Guardar cambios' : 'Crear Sucursal'}</button>
                            <button type="button" className="org-btn org-btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// SECCIÓN: DEPARTAMENTOS
// ─────────────────────────────────────────────────────────────
const DepartamentosView: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [sucursales, setSucursales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ clave: '', nombre: '', descripcion: '', sucursal_id: '', padre_id: '', responsable: '', cc_costo: '' });

    const load = useCallback(() => {
        Promise.all([apiFetch('/departamentos'), apiFetch('/sucursales')]).then(([d, s]) => {
            if (d.success) setRows(d.data);
            if (s.success) setSucursales(s.data);
            setLoading(false);
        });
    }, []);
    useEffect(() => { load(); }, [load]);

    const openNew = () => { setEditing(null); setForm({ clave: '', nombre: '', descripcion: '', sucursal_id: '', padre_id: '', responsable: '', cc_costo: '' }); setShowForm(true); };
    const openEdit = (r: any) => { setEditing(r); setForm({ ...r, sucursal_id: r.sucursal_id ?? '', padre_id: r.padre_id ?? '' }); setShowForm(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = editing
            ? await apiFetch(`/departamentos/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...form, activo: true }) })
            : await apiFetch('/departamentos', { method: 'POST', body: JSON.stringify(form) });
        if (r.success) { setShowForm(false); load(); }
    };

    if (loading) return <div className="org-loading">⏳ Cargando departamentos…</div>;

    return (
        <div>
            <div className="org-view-header">
                <div>
                    <h2 className="org-view-title">🗂️ Departamentos</h2>
                    <p className="org-view-sub">Áreas funcionales de la organización ({rows.length})</p>
                </div>
                <button className="org-btn org-btn-primary" onClick={openNew}>➕ Nuevo Departamento</button>
            </div>

            <div className="org-table-container">
                <table className="org-table">
                    <thead><tr>
                        <th>Clave</th><th>Nombre</th><th>Sucursal</th><th>Responsable</th><th>CC Costo</th><th>Puestos</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.id}>
                                <td><code className="org-code">{r.clave}</code></td>
                                <td>
                                    <div className="org-td-name">{r.nombre}</div>
                                    {r.descripcion && <div className="org-td-sub">{r.descripcion}</div>}
                                </td>
                                <td>{r.sucursal_nombre ?? <span className="org-muted">—</span>}</td>
                                <td>{r.responsable ?? <span className="org-muted">—</span>}</td>
                                <td>{r.cc_costo ? <Badge text={r.cc_costo} color="orange" /> : <span className="org-muted">—</span>}</td>
                                <td><Badge text={`${r.total_puestos}`} color="blue" /></td>
                                <td>
                                    <button className="org-btn org-btn-sm org-btn-secondary" onClick={() => openEdit(r)}>✏️ Editar</button>
                                </td>
                            </tr>
                        ))}
                        {!rows.length && (
                            <tr><td colSpan={7} className="org-empty-row">Sin departamentos registrados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title={editing ? '✏️ Editar Departamento' : '🗂️ Nuevo Departamento'} onClose={() => setShowForm(false)} wide>
                    <form className="org-form" onSubmit={handleSubmit}>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Clave *</label>
                                <input className="org-input" required value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value.toUpperCase() })} placeholder="RH, VENTAS, TI…" disabled={!!editing} />
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">CC Costo</label>
                                <input className="org-input" value={form.cc_costo} onChange={e => setForm({ ...form, cc_costo: e.target.value })} placeholder="CC100" />
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Nombre *</label>
                            <input className="org-input" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del departamento" />
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Descripción</label>
                            <textarea className="org-input" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Función principal del departamento…" />
                        </div>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Sucursal</label>
                                <select className="org-input" value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}>
                                    <option value="">— Sin sucursal específica —</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Departamento padre</label>
                                <select className="org-input" value={form.padre_id} onChange={e => setForm({ ...form, padre_id: e.target.value })}>
                                    <option value="">— Sin padre —</option>
                                    {rows.filter(r => !editing || r.id !== editing.id).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Responsable</label>
                            <input className="org-input" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} placeholder="Nombre del responsable" />
                        </div>
                        <div className="org-form-actions">
                            <button type="submit" className="org-btn org-btn-primary org-btn-block">💾 {editing ? 'Guardar cambios' : 'Crear Departamento'}</button>
                            <button type="button" className="org-btn org-btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// SECCIÓN: PUESTOS
// ─────────────────────────────────────────────────────────────
const NIVEL_COLORS: Record<string, string> = {
    OPERATIVO: 'gray', ADMINISTRATIVO: 'blue', COORDINACION: 'green',
    SUPERVISION: 'orange', JEFATURA: 'purple', GERENCIA: 'purple',
    DIRECCION: 'blue', DIRECCION_GRAL: 'blue',
};

const PuestosView: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [niveles, setNiveles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ clave: '', nombre: '', descripcion: '', nivel_puesto: 'OPERATIVO', departamento_id: '', salario_min: '', salario_max: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const load = useCallback(() => {
        Promise.all([apiFetch('/puestos'), apiFetch('/departamentos'), apiFetch('/niveles-puesto')]).then(([p, d, n]) => {
            if (p.success) setRows(p.data);
            if (d.success) setDepartamentos(d.data);
            if (n.success) setNiveles(n.data);
            setLoading(false);
        });
    }, []);
    useEffect(() => { load(); }, [load]);

    const filteredRows = rows.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.departamento_nombre ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openNew = () => { setEditing(null); setForm({ clave: '', nombre: '', descripcion: '', nivel_puesto: 'OPERATIVO', departamento_id: '', salario_min: '', salario_max: '' }); setShowForm(true); };
    const openEdit = (r: any) => { setEditing(r); setForm({ ...r, departamento_id: r.departamento_id ?? '', salario_min: r.salario_min ?? '', salario_max: r.salario_max ?? '' }); setShowForm(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = editing
            ? await apiFetch(`/puestos/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...form, activo: true }) })
            : await apiFetch('/puestos', { method: 'POST', body: JSON.stringify(form) });
        if (r.success) { setShowForm(false); load(); }
    };

    if (loading) return <div className="org-loading">⏳ Cargando puestos…</div>;

    return (
        <div>
            <div className="org-view-header">
                <div>
                    <h2 className="org-view-title">💼 Puestos</h2>
                    <p className="org-view-sub">Catálogo de puestos autorizados ({rows.length})</p>
                </div>
                <div className="org-header-actions">
                    <input className="org-input org-search" placeholder="🔍 Buscar puesto…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <button className="org-btn org-btn-primary" onClick={openNew}>➕ Nuevo Puesto</button>
                </div>
            </div>

            <div className="org-table-container">
                <table className="org-table">
                    <thead><tr>
                        <th>Clave</th><th>Nombre</th><th>Nivel</th><th>Departamento</th><th>Rango Salarial</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>
                        {filteredRows.map(r => (
                            <tr key={r.id}>
                                <td><code className="org-code">{r.clave}</code></td>
                                <td>
                                    <div className="org-td-name">{r.nombre}</div>
                                    {r.descripcion && <div className="org-td-sub">{r.descripcion}</div>}
                                </td>
                                <td><Badge text={r.nivel_puesto ?? '—'} color={(NIVEL_COLORS[r.nivel_puesto] ?? 'gray') as any} /></td>
                                <td>{r.departamento_nombre ?? <span className="org-muted">—</span>}</td>
                                <td>
                                    {r.salario_min && r.salario_max
                                        ? <span className="org-salary">${Number(r.salario_min).toLocaleString()} – ${Number(r.salario_max).toLocaleString()}</span>
                                        : <span className="org-muted">—</span>}
                                </td>
                                <td>
                                    <button className="org-btn org-btn-sm org-btn-secondary" onClick={() => openEdit(r)}>✏️ Editar</button>
                                </td>
                            </tr>
                        ))}
                        {!filteredRows.length && (
                            <tr><td colSpan={6} className="org-empty-row">Sin puestos que coincidan con la búsqueda</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <Modal title={editing ? '✏️ Editar Puesto' : '💼 Nuevo Puesto'} onClose={() => setShowForm(false)} wide>
                    <form className="org-form" onSubmit={handleSubmit}>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Clave *</label>
                                <input className="org-input" required value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value.toUpperCase() })} placeholder="GTE_RH, ANALISTA_V…" disabled={!!editing} />
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Nivel de puesto *</label>
                                <select className="org-input" value={form.nivel_puesto} onChange={e => setForm({ ...form, nivel_puesto: e.target.value })}>
                                    {niveles.map(n => <option key={n.clave} value={n.clave}>{n.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Nombre del puesto *</label>
                            <input className="org-input" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Gerente de Recursos Humanos" />
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Departamento</label>
                            <select className="org-input" value={form.departamento_id} onChange={e => setForm({ ...form, departamento_id: e.target.value })}>
                                <option value="">— Sin departamento específico —</option>
                                {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                            </select>
                        </div>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Salario mínimo ($)</label>
                                <input type="number" className="org-input" value={form.salario_min} onChange={e => setForm({ ...form, salario_min: e.target.value })} placeholder="15000" />
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Salario máximo ($)</label>
                                <input type="number" className="org-input" value={form.salario_max} onChange={e => setForm({ ...form, salario_max: e.target.value })} placeholder="25000" />
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Descripción</label>
                            <textarea className="org-input" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Funciones principales del puesto…" />
                        </div>
                        <div className="org-form-actions">
                            <button type="submit" className="org-btn org-btn-primary org-btn-block">💾 {editing ? 'Guardar cambios' : 'Crear Puesto'}</button>
                            <button type="button" className="org-btn org-btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// SECCIÓN: CENTROS DE COSTO
// ─────────────────────────────────────────────────────────────
const CentrosCostoView: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [sucursales, setSucursales] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ clave: '', nombre: '', descripcion: '', sucursal_id: '', departamento_id: '' });

    const load = useCallback(() => {
        Promise.all([apiFetch('/centros-costo'), apiFetch('/sucursales'), apiFetch('/departamentos')]).then(([cc, s, d]) => {
            if (cc.success) setRows(cc.data);
            if (s.success) setSucursales(s.data);
            if (d.success) setDepartamentos(d.data);
            setLoading(false);
        });
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await apiFetch('/centros-costo', { method: 'POST', body: JSON.stringify(form) });
        if (r.success) { setShowForm(false); setForm({ clave: '', nombre: '', descripcion: '', sucursal_id: '', departamento_id: '' }); load(); }
    };

    if (loading) return <div className="org-loading">⏳ Cargando centros de costo…</div>;

    return (
        <div>
            <div className="org-view-header">
                <div>
                    <h2 className="org-view-title">💰 Centros de Costo</h2>
                    <p className="org-view-sub">Clasificación contable y presupuestal ({rows.length})</p>
                </div>
                <button className="org-btn org-btn-primary" onClick={() => setShowForm(true)}>➕ Nuevo CC</button>
            </div>

            <div className="org-cc-grid">
                {rows.map(r => (
                    <div key={r.id} className="org-cc-card">
                        <div className="org-cc-clave">{r.clave}</div>
                        <div className="org-cc-nombre">{r.nombre}</div>
                        {r.descripcion && <div className="org-cc-desc">{r.descripcion}</div>}
                        <div className="org-cc-meta">
                            {r.sucursal_nombre && <span>🏢 {r.sucursal_nombre}</span>}
                            {r.departamento_nombre && <span>🗂️ {r.departamento_nombre}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <Modal title="💰 Nuevo Centro de Costo" onClose={() => setShowForm(false)}>
                    <form className="org-form" onSubmit={handleSubmit}>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Clave *</label>
                                <input className="org-input" required value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value.toUpperCase() })} placeholder="CC700" />
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Nombre *</label>
                                <input className="org-input" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="CC700 - Logística" />
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Descripción</label>
                            <textarea className="org-input" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                        </div>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Sucursal</label>
                                <select className="org-input" value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}>
                                    <option value="">— Todas —</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Departamento</label>
                                <select className="org-input" value={form.departamento_id} onChange={e => setForm({ ...form, departamento_id: e.target.value })}>
                                    <option value="">— Todos —</option>
                                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="org-form-actions">
                            <button type="submit" className="org-btn org-btn-primary org-btn-block">💾 Crear Centro de Costo</button>
                            <button type="button" className="org-btn org-btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// SECCIÓN: ORGANIGRAMA
// ─────────────────────────────────────────────────────────────
const OrganigramaView: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [puestos, setPuestos] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ puesto_id: '', puesto_jefe_id: '', departamento_id: '', nivel_jerarquico: '1', es_jefe_directo: true });

    const load = useCallback(() => {
        Promise.all([apiFetch('/organigrama'), apiFetch('/puestos'), apiFetch('/departamentos')]).then(([o, p, d]) => {
            if (o.success) setRows(o.data);
            if (p.success) setPuestos(p.data);
            if (d.success) setDepartamentos(d.data);
            setLoading(false);
        });
    }, []);
    useEffect(() => { load(); }, [load]);

    const openNew = () => {
        setEditing(null);
        setForm({ puesto_id: '', puesto_jefe_id: '', departamento_id: '', nivel_jerarquico: '1', es_jefe_directo: true });
        setShowForm(true);
    };

    const openEdit = (r: any) => {
        setEditing(r);
        setForm({
            puesto_id: r.puesto_id ?? '',
            puesto_jefe_id: r.puesto_jefe_id ?? '',
            departamento_id: r.departamento_id ?? '',
            nivel_jerarquico: String(r.nivel_jerarquico ?? 1),
            es_jefe_directo: r.es_jefe_directo ?? true,
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = editing
            ? await apiFetch(`/organigrama/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...form, vigente: true }) })
            : await apiFetch('/organigrama', { method: 'POST', body: JSON.stringify(form) });
        if (r.success) { setShowForm(false); setEditing(null); load(); }
    };

    const handleDelete = async (r: any) => {
        if (!window.confirm(`¿Eliminar la relación de «${r.puesto?.nombre ?? r.puesto_nombre}»?`)) return;
        const res = await apiFetch(`/organigrama/${r.id}`, { method: 'DELETE' });
        if (res.success) load();
    };

    const buildTree = useCallback(() => {
        const puestosById = new Map((puestos || []).map((p: any) => [p.id, p]));
        const nodes = (rows || []).map((r: any) => ({
            ...r,
            puesto: puestosById.get(r.puesto_id),
            children: [] as any[],
        }));

        const lookup = new Map<number, any>();
        nodes.forEach((node: any) => lookup.set(node.puesto_id, node));

        const roots: any[] = [];
        nodes.forEach((node: any) => {
            if (!node.puesto_jefe_id) {
                roots.push(node);
            } else {
                const parent = lookup.get(node.puesto_jefe_id);
                if (parent) parent.children.push(node);
                else roots.push(node);
            }
        });

        const sortByName = (a: any, b: any) => (a.puesto?.nombre ?? a.puesto_nombre).localeCompare(b.puesto?.nombre ?? b.puesto_nombre);
        const walk = (list: any[]) => {
            list.sort(sortByName);
            list.forEach((node: any) => {
                if (node.children.length) walk(node.children);
            });
        };
        walk(roots);

        return roots;
    }, [rows, puestos]);

    const tree = buildTree();

    const TreeNode: React.FC<{ node: any }> = ({ node }) => {
        const displayName = node.puesto?.nombre ?? node.puesto_nombre;
        const displayDept = node.departamento_nombre ?? node.puesto?.departamento_nombre;
        const displayLevel = node.nivel_puesto ?? node.puesto?.nivel_puesto ?? 'Sin nivel';

        return (
            <div className="org-tree-node">
                <div className="org-tree-card">
                    <div className="org-tree-title">{displayName}</div>
                    <div className="org-tree-level">
                        <Badge text={displayLevel} color={(NIVEL_COLORS[displayLevel] ?? 'gray') as any} />
                    </div>
                    {node.jefe_nombre && (
                        <div className="org-tree-reports">
                            ↑ Reporta a: <strong>{node.jefe_nombre}</strong>
                        </div>
                    )}
                    {displayDept && <div className="org-tree-dept">🗂️ {displayDept}</div>}
                    <div className="org-tree-actions">
                        <button type="button" className="org-btn org-btn-sm org-btn-primary" onClick={() => openEdit(node)}>✏️ Editar</button>
                        <button type="button" className="org-btn org-btn-sm org-btn-danger" onClick={() => handleDelete(node)}>🗑️ Eliminar</button>
                    </div>
                </div>
                {node.children?.length > 0 && (
                    <div className="org-tree-children">
                        {node.children.map((child: any) => (
                            <TreeNode key={child.id} node={child} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="org-loading">⏳ Cargando organigrama…</div>;

    return (
        <div>
            <div className="org-view-header">
                <div>
                    <h2 className="org-view-title">🌲 Organigrama</h2>
                    <p className="org-view-sub">Jerarquías y relaciones entre puestos</p>
                </div>
                <button className="org-btn org-btn-primary" onClick={openNew}>➕ Nueva Relación</button>
            </div>

            {tree.length === 0 && (
                <div className="org-empty">
                    <div className="org-empty-icon">🌲</div>
                    <p>No hay relaciones jerárquicas definidas aún</p>
                    <button className="org-btn org-btn-primary" onClick={openNew}>Definir primera relación</button>
                </div>
            )}

            {tree.length > 0 && (
                <div className="org-tree-root">
                    {tree.map((root: any) => (
                        <TreeNode key={root.id} node={root} />
                    ))}
                </div>
            )}

            {showForm && (
                <Modal title={editing ? '✏️ Editar Relación Jerárquica' : '🌲 Nueva Relación Jerárquica'} onClose={() => setShowForm(false)} wide>
                    <form className="org-form" onSubmit={handleSubmit}>
                        <div className="org-form-group">
                            <label className="org-label">Puesto subordinado *</label>
                            <select className="org-input" required value={form.puesto_id} disabled={!!editing} onChange={e => setForm({ ...form, puesto_id: e.target.value })}>
                                <option value="">Selecciona el puesto…</option>
                                {puestos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.nivel_puesto})</option>)}
                            </select>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Reporta a (jefe directo)</label>
                            <select className="org-input" value={form.puesto_jefe_id} onChange={e => setForm({ ...form, puesto_jefe_id: e.target.value })}>
                                <option value="">— Sin jefe / nivel máximo —</option>
                                {puestos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.nivel_puesto})</option>)}
                            </select>
                        </div>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Departamento</label>
                                <select className="org-input" value={form.departamento_id} onChange={e => setForm({ ...form, departamento_id: e.target.value })}>
                                    <option value="">— Ninguno —</option>
                                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                </select>
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Nivel jerárquico</label>
                                <input type="number" min={1} max={10} className="org-input" value={form.nivel_jerarquico} onChange={e => setForm({ ...form, nivel_jerarquico: e.target.value })} />
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-check">
                                <input type="checkbox" checked={!!form.es_jefe_directo} onChange={e => setForm({ ...form, es_jefe_directo: e.target.checked })} />
                                Jefe directo
                            </label>
                        </div>
                        <div className="org-form-actions">
                            <button type="submit" className="org-btn org-btn-primary org-btn-block">💾 {editing ? 'Guardar cambios' : 'Guardar Relación'}</button>
                            <button type="button" className="org-btn org-btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// SECCIÓN: UBICACIONES FÍSICAS
// ─────────────────────────────────────────────────────────────
const TIPO_UBI_ICON: Record<string, string> = {
    OFICINA: '🖥️', PLANTA: '🏭', ALMACEN: '📦', HOME_OFFICE: '🏠', SALA_REUNION: '🤝'
};

const UbicacionesView: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [sucursales, setSucursales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ clave: '', nombre: '', tipo: 'OFICINA', sucursal_id: '', piso: '', descripcion: '', capacidad: '' });

    const load = useCallback(() => {
        Promise.all([apiFetch('/ubicaciones'), apiFetch('/sucursales')]).then(([u, s]) => {
            if (u.success) setRows(u.data);
            if (s.success) setSucursales(s.data);
            setLoading(false);
        });
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await apiFetch('/ubicaciones', { method: 'POST', body: JSON.stringify(form) });
        if (r.success) { setShowForm(false); setForm({ clave: '', nombre: '', tipo: 'OFICINA', sucursal_id: '', piso: '', descripcion: '', capacidad: '' }); load(); }
    };

    if (loading) return <div className="org-loading">⏳ Cargando ubicaciones…</div>;

    return (
        <div>
            <div className="org-view-header">
                <div>
                    <h2 className="org-view-title">📍 Ubicaciones Físicas</h2>
                    <p className="org-view-sub">Lugares específicos dentro de cada sucursal ({rows.length})</p>
                </div>
                <button className="org-btn org-btn-primary" onClick={() => setShowForm(true)}>➕ Nueva Ubicación</button>
            </div>

            <div className="org-cards-grid">
                {rows.map(r => (
                    <div key={r.id} className="org-entity-card">
                        <div className="org-entity-card-top">
                            <div className="org-entity-icon-wrap">{TIPO_UBI_ICON[r.tipo] ?? '📍'}</div>
                            <div className="org-entity-info">
                                <div className="org-entity-name">{r.nombre}</div>
                                <div className="org-entity-clave">{r.clave}</div>
                            </div>
                            <Badge text={r.tipo.replace('_', ' ')} color="blue" />
                        </div>
                        <div className="org-entity-meta">
                            {r.sucursal_nombre && <span>🏢 {r.sucursal_nombre}</span>}
                            {r.piso && <span>🏗️ Piso {r.piso}</span>}
                            {r.capacidad && <span>👥 Cap. {r.capacidad}</span>}
                        </div>
                        {r.descripcion && <div className="org-entity-desc">{r.descripcion}</div>}
                    </div>
                ))}
            </div>

            {showForm && (
                <Modal title="📍 Nueva Ubicación Física" onClose={() => setShowForm(false)}>
                    <form className="org-form" onSubmit={handleSubmit}>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Clave *</label>
                                <input className="org-input" required value={form.clave} onChange={e => setForm({ ...form, clave: e.target.value.toUpperCase() })} placeholder="OF_RH, SALA_A…" />
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Tipo</label>
                                <select className="org-input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                                    {['OFICINA', 'PLANTA', 'ALMACEN', 'HOME_OFFICE', 'SALA_REUNION'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Nombre *</label>
                            <input className="org-input" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Oficina Recursos Humanos" />
                        </div>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Sucursal</label>
                                <select className="org-input" value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}>
                                    <option value="">— Sin sucursal —</option>
                                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                            <div className="org-form-group">
                                <label className="org-label">Piso</label>
                                <input className="org-input" value={form.piso} onChange={e => setForm({ ...form, piso: e.target.value })} placeholder="PB, 1, 2…" />
                            </div>
                        </div>
                        <div className="org-grid-2">
                            <div className="org-form-group">
                                <label className="org-label">Capacidad (personas)</label>
                                <input type="number" className="org-input" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} placeholder="10" />
                            </div>
                        </div>
                        <div className="org-form-group">
                            <label className="org-label">Descripción</label>
                            <textarea className="org-input" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                        </div>
                        <div className="org-form-actions">
                            <button type="submit" className="org-btn org-btn-primary org-btn-block">💾 Crear Ubicación</button>
                            <button type="button" className="org-btn org-btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
type OrgTab = 'resumen' | 'sucursales' | 'departamentos' | 'puestos' | 'centros-costo' | 'organigrama' | 'ubicaciones';

interface OrganizacionModuleProps {
    initialTab?: OrgTab;
}

const OrganizacionModule: React.FC<OrganizacionModuleProps> = ({ initialTab = 'resumen' }) => {
    const [tab, setTab] = useState<OrgTab>(initialTab);

    useEffect(() => { setTab(initialTab); }, [initialTab]);

    const tabs: { key: OrgTab; label: string }[] = [
        { key: 'resumen',       label: '🏠 Inicio' },
        { key: 'sucursales',    label: '🏢 Sucursales' },
        { key: 'departamentos', label: '🗂️ Departamentos' },
        { key: 'puestos',       label: '💼 Puestos' },
        { key: 'centros-costo', label: '💰 Centros de Costo' },
        { key: 'organigrama',   label: '🌲 Organigrama' },
        { key: 'ubicaciones',   label: '📍 Ubicaciones' },
    ];

    return (
        <div>
            <div className="org-tabs">
                {tabs.map(t => (
                    <button key={t.key} className={`org-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="org-content">
                {tab === 'resumen'       && <ResumenView />}
                {tab === 'sucursales'    && <SucursalesView />}
                {tab === 'departamentos' && <DepartamentosView />}
                {tab === 'puestos'       && <PuestosView />}
                {tab === 'centros-costo' && <CentrosCostoView />}
                {tab === 'organigrama'   && <OrganigramaView />}
                {tab === 'ubicaciones'   && <UbicacionesView />}
            </div>
        </div>
    );
};

export default OrganizacionModule;
