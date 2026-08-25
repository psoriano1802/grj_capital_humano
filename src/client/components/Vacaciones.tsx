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

const VacacionesModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'solicitar-vacaciones' }) => {
    const [tab, setTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [vacaciones, setVacaciones] = useState<any[]>([]);
    const [reporte, setReporte] = useState<any[]>([]);
    const { currentUser } = useSession();
    
    // Formulario de Solicitud
    const [form, setForm] = useState({
        empleado_id: 1, // Se sincroniza con la identidad activa
        periodo_year: new Date().getFullYear(),
        dias_disponibles: 12,
        dias_pendientes: 12,
        fecha_inicio: '',
        fecha_fin: '',
        dias_a_solicitar: ''
    });

    useEffect(() => { setTab(initialTab); }, [initialTab]);

    // Sincroniza la identidad activa con el formulario y su balance
    useEffect(() => {
        if (!currentUser) return;
        setForm(prev => ({ ...prev, empleado_id: currentUser.id }));
        const year = new Date().getFullYear();
        (async () => {
            const res = await fetchApi(`/api/vacaciones/balance/${currentUser.id}/${year}`);
            if (res.success && res.data) {
                setForm(prev => ({
                    ...prev,
                    empleado_id: currentUser.id,
                    dias_disponibles: res.data.dias_disponibles ?? 0,
                    dias_pendientes: res.data.dias_pendientes ?? 0,
                }));
            }
        })();
    }, [currentUser]);

    useEffect(() => {
        if (tab === 'mis-vacaciones' || tab === 'aprobar-vacaciones') {
            loadVacaciones();
        }
        if (tab === 'balance-vacaciones') {
            loadReporte();
        }
    }, [tab]);

    const loadVacaciones = async () => {
        setLoading(true);
        const url = tab === 'aprobar-vacaciones'
            ? '/api/vacaciones/pendientes'               // solicitudes por aprobar
            : currentUser ? `/api/vacaciones/empleado/${currentUser.id}`  // historial del empleado activo
            : null;
        if (!url) { setVacaciones([]); setLoading(false); return; }
        const res = await fetchApi(url);
        setVacaciones(res.success && Array.isArray(res.data) ? res.data : []);
        setLoading(false);
    };

    const loadReporte = async () => {
        setLoading(true);
        const res = await fetchApi('/api/vacaciones/reporte');
        setReporte(res.success && Array.isArray(res.data) ? res.data : []);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const diasSoli = parseInt(form.dias_a_solicitar) || 0;
        if (diasSoli > form.dias_pendientes) {
            alert('❌ No puedes solicitar más días de los que tienes pendientes.');
            return;
        }

        const payload = {
            empleado_id: currentUser?.id ?? form.empleado_id,
            periodo_year: form.periodo_year,
            fecha_inicio: form.fecha_inicio,
            fecha_fin: form.fecha_fin,
            dias_solicitados: diasSoli
        };

        const res = await fetchApi('/api/vacaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.success) {
            alert('✅ Solicitud de vacaciones enviada exitosamente.');
            setForm({ ...form, fecha_inicio: '', fecha_fin: '', dias_a_solicitar: '' });
            setTab('mis-vacaciones');
        } else {
            alert('❌ Error al enviar solicitud.');
        }
    };

    const handleAprobar = async (v: any) => {
        if(!confirm('¿Aprobar solicitud de vacaciones?')) return;
        const res = await fetchApi(`/api/vacaciones/${v.id}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aprobado_por: currentUser?.id ?? null, comentarios: 'Vacaciones aprobadas' })
        });
        if (res.success) { alert('✅ Vacaciones aprobadas.'); loadVacaciones(); }
        else alert(res.error || '❌ No se pudo aprobar la solicitud.');
    };

    const handleRechazar = async (v: any) => {
        if(!confirm('¿Rechazar solicitud de vacaciones?')) return;
        const motivos = prompt('Motivo del rechazo');
        if (motivos === null) return;
        if (!motivos.trim()) { alert('❌ Se requiere un comentario para rechazar.'); return; }
        const res = await fetchApi(`/api/vacaciones/${v.id}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aprobado_por: currentUser?.id ?? null, comentarios: motivos.trim() })
        });
        if (res.success) { alert('❌ Vacaciones rechazadas.'); loadVacaciones(); }
        else alert(res.error || '❌ No se pudo rechazar la solicitud.');
    };

    return (
        <div className="fade-in">
            <div className="org-tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                <button className={`org-tab ${tab === 'solicitar-vacaciones' ? 'active' : ''}`} onClick={() => setTab('solicitar-vacaciones')}>🏖️ Solicitar</button>
                <button className={`org-tab ${tab === 'mis-vacaciones' ? 'active' : ''}`} onClick={() => setTab('mis-vacaciones')}>📅 Mis Vacaciones</button>
                <button className={`org-tab ${tab === 'aprobar-vacaciones' ? 'active' : ''}`} onClick={() => setTab('aprobar-vacaciones')}>✅ Aprobaciones</button>
                <button className={`org-tab ${tab === 'balance-vacaciones' ? 'active' : ''}`} onClick={() => setTab('balance-vacaciones')}>📊 Balance General</button>
            </div>

            {tab === 'solicitar-vacaciones' && (
                <div>
                    <div className="section-header">
                        <h1>🏖️ Solicitar Vacaciones</h1>
                        <p>Programa tus días de descanso según balance</p>
                    </div>

                    <div className="grid grid-2">
                        <div className="card">
                            <h3 className="mb-md">📊 Tu Balance de Vacaciones ({form.periodo_year})</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{form.dias_disponibles}</div>
                                    <div className="stat-label">Días Disponibles</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{form.dias_disponibles - form.dias_pendientes}</div>
                                    <div className="stat-label">Días Tomados</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value" style={{ color: form.dias_pendientes > 0 ? '#10b981' : '#ef4444' }}>{form.dias_pendientes}</div>
                                    <div className="stat-label">Días Pendientes</div>
                                </div>
                            </div>
                            <p style={{ marginTop: '1.5rem', color: 'var(--gray-400)', fontSize: '0.85rem' }}>
                                ℹ️ Los días se descuentan al realizar la solicitud; aprobar/rechazar solo actualiza el estatus del requerimiento.
                            </p>
                        </div>
                        
                        <div className="card">
                            <h3 className="mb-md">➕ Nueva Solicitud</h3>
                            <form className="form" onSubmit={handleSubmit}>
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
                                    <label className="label">Días Totales a Consumir *</label>
                                    <input type="number" required className="input" placeholder="Ej: 5 (Descontar fines de semana)" value={form.dias_a_solicitar} onChange={e => setForm({...form, dias_a_solicitar: e.target.value})} />
                                </div>
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                                        <span>📤</span> Solicitar Vacaciones
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {(tab === 'mis-vacaciones' || tab === 'aprobar-vacaciones') && (
                <div>
                    <div className="section-header">
                        <h1>{tab === 'mis-vacaciones' ? '📅 Mis Vacaciones' : '✅ Aprobar Vacaciones'}</h1>
                        <p>{loading ? '⏳ Cargando solicitudes...' : `${vacaciones.length} solicitudes encontradas`}</p>
                    </div>

                    {vacaciones.length === 0 && !loading && (
                        <div className="card empty-state">
                            <div className="empty-icon">🏖️</div>
                            <h3>Sin registros de vacaciones.</h3>
                        </div>
                    )}

                    {vacaciones.length > 0 && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Periodo/Fechas</th>
                                        <th>Días Solicitados</th>
                                        <th>Estatus</th>
                                        {tab === 'aprobar-vacaciones' && <th>Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {vacaciones.map((v: any) => (
                                        <tr key={v.id}>
                                            <td>
                                                <strong>{v.nombre} {v.apellido_paterno}</strong>
                                                {v.numero_empleado && <div style={{fontSize: '0.8rem', color: 'var(--gray-400)'}}>{v.numero_empleado}</div>}
                                            </td>
                                            <td>
                                                <strong>Año {v.periodo_year}</strong><br/>
                                                <span style={{fontSize: '0.85rem', color: 'var(--gray-400)'}}>
                                                    {v.fecha_inicio && v.fecha_fin
                                                        ? `${new Date(v.fecha_inicio).toLocaleDateString()} a ${new Date(v.fecha_fin).toLocaleDateString()}`
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td>{v.dias_tomados ?? 0} días</td>
                                            <td>
                                                <span className={`org-badge ${v.estatus === 'pendiente' ? 'org-badge-orange' : v.estatus === 'aprobado' ? 'org-badge-green' : 'org-badge-gray'}`}>
                                                    {v.estatus}
                                                </span>
                                            </td>
                                            {tab === 'aprobar-vacaciones' && (
                                                <td>
                                                    {v.estatus === 'pendiente' && (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button className="btn btn-success" onClick={() => handleAprobar(v)}>👍</button>
                                                            <button className="btn btn-secondary" style={{ color: '#ef4444' }} onClick={() => handleRechazar(v)}>👎</button>
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

            {tab === 'balance-vacaciones' && (
                <div>
                    <div className="section-header">
                        <h1>📊 Balance General RH</h1>
                        <p>{loading ? '⏳ Cargando reporte...' : `${reporte.length} solicitudes registradas`}</p>
                    </div>

                    {reporte.length === 0 && !loading && (
                        <div className="card empty-state">
                            <div className="empty-icon">👨‍💼</div>
                            <h3>Sin solicitudes registradas.</h3>
                        </div>
                    )}

                    {reporte.length > 0 && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Periodo</th>
                                        <th>Fechas</th>
                                        <th>Días Disp.</th>
                                        <th>Días Tomados</th>
                                        <th>Días Pend.</th>
                                        <th>Estatus</th>
                                        <th>Aprobó</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reporte.map((v: any) => (
                                        <tr key={v.id}>
                                            <td>
                                                <strong>{v.nombre} {v.apellido_paterno} {v.apellido_materno}</strong><br/>
                                                <span style={{fontSize: '0.8rem', color: 'var(--gray-400)'}}>{v.numero_empleado} · {v.departamento || '—'}</span>
                                            </td>
                                            <td>Año {v.periodo_year}</td>
                                            <td>
                                                {v.fecha_inicio && v.fecha_fin
                                                    ? <>{new Date(v.fecha_inicio).toLocaleDateString()} a {new Date(v.fecha_fin).toLocaleDateString()}</>
                                                    : <span style={{color: 'var(--gray-400)'}}>—</span>}
                                            </td>
                                            <td>{v.dias_disponibles}</td>
                                            <td>{v.dias_tomados ?? 0}</td>
                                            <td>{v.dias_pendientes}</td>
                                            <td>
                                                <span className={`org-badge ${v.estatus === 'pendiente' ? 'org-badge-orange' : v.estatus === 'aprobado' ? 'org-badge-green' : 'org-badge-gray'}`}>
                                                    {v.estatus}
                                                </span>
                                            </td>
                                            <td>
                                                {v.aprobado_nombre
                                                    ? <>{v.aprobado_nombre} {v.aprobado_apellido}</>
                                                    : <span style={{color: 'var(--gray-400)'}}>—</span>}
                                            </td>
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

export default VacacionesModule;
