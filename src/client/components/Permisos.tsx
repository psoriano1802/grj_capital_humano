import React, { useState, useEffect } from 'react';
import { useSession } from '../services/SessionContext';

const fetchApi = async (url: string, options?: RequestInit) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch {
        return { success: false, data: [] };
    }
};

const PermisosModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'solicitar-permiso' }) => {
    const [tab, setTab] = useState(initialTab);
    const [permisos, setPermisos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useSession();
    
    // Formulario Permiso
    const [form, setForm] = useState({
        empleado_id: 1, // Se sincroniza con la identidad activa
        tipo_permiso: '',
        fecha_inicio: '',
        fecha_fin: '',
        horas_solicitadas: '',
        motivo: ''
    });

    useEffect(() => { setTab(initialTab); }, [initialTab]);

    // Sincroniza la identidad activa con el formulario
    useEffect(() => {
        if (!currentUser) return;
        setForm(prev => ({ ...prev, empleado_id: currentUser.id }));
    }, [currentUser]);

    useEffect(() => {
        if (tab === 'mis-permisos' || tab === 'aprobar-permisos') {
            loadPermisos();
        }
    }, [tab, currentUser]);

    const loadPermisos = async () => {
        setLoading(true);
        let url: string | null = null;
        if (tab === 'mis-permisos') {
            url = currentUser ? `/api/permisos/empleado/${currentUser.id}` : null;
        } else if (tab === 'aprobar-permisos') {
            url = currentUser ? `/api/permisos/pendientes?aprobador_id=${currentUser.id}` : null;
        }
        if (!url) { setPermisos([]); setLoading(false); return; }
        const res = await fetchApi(url);
        setPermisos(res.success && Array.isArray(res.data) ? res.data : []);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetchApi('/api/permisos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, empleado_id: currentUser?.id ?? form.empleado_id, horas_solicitadas: parseFloat(form.horas_solicitadas) || 8 })
        });

        if (res.success) {
            alert('✅ Solicitud de permiso enviada.');
            setForm({ empleado_id: currentUser?.id ?? form.empleado_id, tipo_permiso: '', fecha_inicio: '', fecha_fin: '', horas_solicitadas: '', motivo: '' });
            setTab('mis-permisos');
        } else {
            alert('❌ Error enviando solicitud.');
        }
    };

    const handleAprobar = async (id: number) => {
        if(!confirm('¿Aprobar permiso?')) return;
        const res = await fetchApi(`/api/permisos/${id}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aprobado_por: currentUser?.id ?? null, comentarios: 'Aprobado por RH' })
        });
        if (res.success) loadPermisos();
        else alert(res.error || '❌ No se pudo aprobar el permiso.');
    };

    const handleRechazar = async (id: number) => {
        if(!confirm('¿Rechazar permiso?')) return;
        const motivos = prompt('Motivo del rechazo');
        if (motivos === null) return;
        if (!motivos.trim()) { alert('❌ Se requiere un comentario para rechazar.'); return; }
        const res = await fetchApi(`/api/permisos/${id}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aprobado_por: currentUser?.id ?? null, comentarios: motivos.trim() })
        });
        if (res.success) loadPermisos();
        else alert(res.error || '❌ No se pudo rechazar el permiso.');
    };

    return (
        <div className="fade-in">
            <div className="org-tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                <button className={`org-tab ${tab === 'solicitar-permiso' ? 'active' : ''}`} onClick={() => setTab('solicitar-permiso')}>➕ Solicitar</button>
                <button className={`org-tab ${tab === 'mis-permisos' ? 'active' : ''}`} onClick={() => setTab('mis-permisos')}>📋 Mis Permisos</button>
                <button className={`org-tab ${tab === 'aprobar-permisos' ? 'active' : ''}`} onClick={() => setTab('aprobar-permisos')}>✅ Aprobaciones</button>
            </div>

            {tab === 'solicitar-permiso' && (
                <div>
                    <div className="section-header">
                        <h1>📝 Solicitar Permiso</h1>
                        <p>Crea una nueva solicitud de permiso</p>
                    </div>
                    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <form className="form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="label">Tipo de Permiso *</label>
                                <select className="input" required value={form.tipo_permiso} onChange={e => setForm({...form, tipo_permiso: e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    <option value="PERSONAL">Permiso Personal</option>
                                    <option value="MEDICO">Permiso Médico</option>
                                    <option value="ESTUDIO">Permiso de Estudio</option>
                                    <option value="FAMILIAR">Permiso Familiar</option>
                                </select>
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Fecha Inicio *</label>
                                    <input type="date" required className="input" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Fecha Fin *</label>
                                    <input type="date" required className="input" value={form.fecha_fin} min={form.fecha_inicio} onChange={e => setForm({...form, fecha_fin: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Horas Solicitadas</label>
                                <input type="number" step="0.5" className="input" placeholder="Ej: 8" value={form.horas_solicitadas} onChange={e => setForm({...form, horas_solicitadas: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label className="label">Motivo *</label>
                                <textarea className="input" required rows={4} placeholder="Describe el motivo de tu permiso..." value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                                <span>📤</span> Enviar Solicitud
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {(tab === 'mis-permisos' || tab === 'aprobar-permisos') && (
                <div>
                    <div className="section-header">
                        <h1>{tab === 'mis-permisos' ? '📋 Mis Permisos' : '✅ Aprobar Permisos'}</h1>
                        <p>{loading ? '⏳ Cargando solicitudes...' : `${permisos.length} solicitudes encontradas`}</p>
                    </div>
                    
                    {permisos.length === 0 && !loading && (
                        <div className="card empty-state">
                            <div className="empty-icon">📝</div>
                            <h3>No hay permisos registrados.</h3>
                        </div>
                    )}
                    
                    {permisos.length > 0 && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Solicitante</th>
                                        <th>Departamento</th>
                                        <th>Puesto</th>
                                        <th>Tipo</th>
                                        <th>Fechas</th>
                                        <th>Motivo</th>
                                        <th>Estado</th>
                                        {tab === 'aprobar-permisos' && <th>Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {permisos.map((p: any) => (
                                        <tr key={p.id}>
                                            <td>
                                                <strong>{p.numero_empleado}</strong>
                                                <br />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                                                    {p.nombre} {p.apellido_paterno}
                                                </span>
                                            </td>
                                            <td>{p.departamento || '—'}</td>
                                            <td>{p.puesto || '—'}</td>
                                            <td><strong>{p.tipo_permiso}</strong></td>
                                            <td>{new Date(p.fecha_inicio).toLocaleDateString()} a {new Date(p.fecha_fin).toLocaleDateString()}<br/><span style={{fontSize: '0.8rem', color: 'var(--gray-400)'}}>{p.horas_solicitadas} hrs</span></td>
                                            <td>{p.motivo}</td>
                                            <td>
                                                <span className={`org-badge ${p.estatus === 'pendiente' ? 'org-badge-orange' : p.estatus === 'aprobado' ? 'org-badge-green' : 'org-badge-gray'}`}>
                                                    {p.estatus}
                                                </span>
                                            </td>
                                            {tab === 'aprobar-permisos' && (
                                                <td>
                                                    {p.estatus === 'pendiente' && (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button className="btn btn-success" onClick={() => handleAprobar(p.id)}>👍</button>
                                                            <button className="btn btn-secondary" style={{ color: '#ef4444' }} onClick={() => handleRechazar(p.id)}>👎</button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default PermisosModule;
