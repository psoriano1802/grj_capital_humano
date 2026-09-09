import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../services/SessionContext';

const BASE = '/api/capacitaciones';

const apiFetch = async (path: string, opts?: RequestInit) => {
    try {
        const res = await fetch(`${BASE}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            ...opts,
        });
        const json = await res.json();
        if (!res.ok) return { success: false, error: json.error ?? `Error ${res.status}`, data: null };
        return json;
    } catch { return { success: false, error: 'Sin conexión', data: null }; }
};

// ── Modal genérico ──────────────────────────────────────
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ background: 'var(--bg-dark-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, width: wide ? '90%' : 500, maxWidth: wide ? 900 : 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, color: 'var(--gray-100)' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--gray-400)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            {children}
        </div>
    </div>
);

const Badge: React.FC<{ text: string; color: 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'red' }> = ({ text, color }) => {
    const colors: Record<string, string> = {
        blue: 'rgba(14,165,233,0.2)', green: 'rgba(16,185,129,0.2)', purple: 'rgba(139,92,246,0.2)',
        orange: 'rgba(245,158,11,0.2)', gray: 'rgba(156,163,175,0.2)', red: 'rgba(239,68,68,0.2)'
    };
    return <span style={{ padding: '2px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, background: colors[color], color: `var(--${color === 'blue' ? 'primary' : color === 'green' ? 'success' : color === 'red' ? 'error' : color}-400)` }}>{text}</span>;
};

// ── CATÁLOGO DE CURSOS ─────────────────────────────────
const CatalogoView: React.FC<{ onVerDetalle: (id: number) => void }> = ({ onVerDetalle }) => {
    const [cursos, setCursos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editando, setEditando] = useState<any>(null);
    const [form, setForm] = useState({ titulo: '', descripcion: '', tipo: 'interna', proveedor: '', fecha_inicio: '', fecha_fin: '', duracion_horas: '', costo: '', capacidad: '', modalidad: 'presencial', estatus: 'activa' });

    const load = () => { setLoading(true); apiFetch('/').then(r => { setCursos(r.data || []); setLoading(false); }); };

    useEffect(() => { load(); }, []);

    const abrirNuevo = () => { setEditando(null); setForm({ titulo: '', descripcion: '', tipo: 'interna', proveedor: '', fecha_inicio: '', fecha_fin: '', duracion_horas: '', costo: '', capacidad: '', modalidad: 'presencial', estatus: 'activa' }); setShowForm(true); };
    const abrirEdit = (c: any) => { setEditando(c); setForm({ titulo: c.titulo, descripcion: c.descripcion || '', tipo: c.tipo, proveedor: c.proveedor || '', fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin, duracion_horas: c.duracion_horas, costo: c.costo, capacidad: c.capacidad, modalidad: c.modalidad, estatus: c.estatus }); setShowForm(true); };

    const guardar = async () => {
        const method = editando ? 'PUT' : 'POST';
        const url = editando ? `/${editando.id}` : '/';
        const r = await apiFetch(url, { method, body: JSON.stringify(form) });
        if (r.success) { setShowForm(false); load(); }
        else alert('Error: ' + r.error);
    };

    const eliminar = async (id: number) => {
        if (!confirm('¿Cancelar esta capacitación?')) return;
        const r = await apiFetch(`/${id}`, { method: 'DELETE' });
        if (r.success) load();
    };

    const cursosFiltrados = cursos.filter(c => c.titulo.toLowerCase().includes(filtro.toLowerCase()) || (c.proveedor || '').toLowerCase().includes(filtro.toLowerCase()));

    const badgeColor = (estatus: string) => ({ activa: 'green', archivada: 'gray', cancelada: 'red' }[estatus] || 'gray');

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>📚 Capacitaciones</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--gray-400)' }}>Catálogo de cursos y programas de desarrollo</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <input className="input" placeholder="Buscar…" value={filtro} onChange={e => setFiltro(e.target.value)} style={{ width: 220 }} />
                    <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva capacitación</button>
                </div>
            </div>

            {loading ? <p style={{ color: 'var(--gray-400)' }}>Cargando…</p> : cursosFiltrados.length === 0 ? (
                <div className="card empty-state"><div className="empty-icon">📚</div><h3>Sin capacitaciones</h3></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {cursosFiltrados.map(c => (
                        <div key={c.id} className="card" style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}
                            onClick={() => onVerDetalle(c.id)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>{c.titulo}</h3>
                                    <p style={{ margin: 0, color: 'var(--gray-400)', fontSize: '0.85rem', lineHeight: 1.4 }}>{c.descripcion?.substring(0, 90)}{c.descripcion?.length > 90 ? '…' : ''}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                                <Badge text={c.tipo} color={c.tipo === 'interna' ? 'blue' : 'purple'} />
                                <Badge text={c.modalidad} color="orange" />
                                <Badge text={c.estatus} color={badgeColor(c.estatus)} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                                <span>📅 {c.fecha_inicio} → {c.fecha_fin}</span>
                                <span>👥 {c.total_inscritos || 0}/{c.capacidad || '∞'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={e => { e.stopPropagation(); abrirEdit(c); }}>Editar</button>
                                <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.8rem' }} onClick={e => { e.stopPropagation(); eliminar(c.id); }}>Cancelar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <Modal title={editando ? 'Editar capacitación' : 'Nueva capacitación'} onClose={() => setShowForm(false)} wide>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label className="label">Título *</label>
                            <input className="input" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                            <label className="label">Descripción</label>
                            <textarea className="input" rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Tipo</label>
                            <select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                                <option value="interna">Interna</option>
                                <option value="externa">Externa</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Modalidad</label>
                            <select className="input" value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}>
                                <option value="presencial">Presencial</option>
                                <option value="virtual">Virtual</option>
                                <option value="hibrida">Híbrida</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Proveedor</label>
                            <input className="input" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Costo ($)</label>
                            <input className="input" type="number" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Fecha inicio *</label>
                            <input className="input" type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Fecha fin *</label>
                            <input className="input" type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Duración (horas)</label>
                            <input className="input" type="number" value={form.duracion_horas} onChange={e => setForm({ ...form, duracion_horas: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Capacidad</label>
                            <input className="input" type="number" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Estatus</label>
                            <select className="input" value={form.estatus} onChange={e => setForm({ ...form, estatus: e.target.value })}>
                                <option value="activa">Activa</option>
                                <option value="archivada">Archivada</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={guardar}>{editando ? 'Guardar cambios' : 'Crear'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ── DETALLE DE CAPACITACIÓN ─────────────────────────────
const DetalleView: React.FC<{ cursoId: number; onBack: () => void }> = ({ cursoId, onBack }) => {
    const { user } = useSession();
    const [curso, setCurso] = useState<any>(null);
    const [sesiones, setSesiones] = useState<any[]>([]);
    const [inscripciones, setInscripciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'sesiones' | 'inscritos' | 'evaluacion'>('info');
    const [showSesionForm, setShowSesionForm] = useState(false);
    const [showInscForm, setShowInscForm] = useState(false);
    const [showEvalForm, setShowEvalForm] = useState(false);
    const [evalData, setEvalData] = useState<any>(null);
    const [sesionForm, setSesionForm] = useState({ fecha_sesion: '', hora_inicio: '', hora_fin: '', lugar: '', instructor: '', temas: '', duracion_horas: '' });
    const [editSesion, setEditSesion] = useState<any>(null);
    const isAdmin = user?.esAdministrador;

    const load = useCallback(async () => {
        setLoading(true);
        const [c, s, i] = await Promise.all([
            apiFetch(`/${cursoId}`),
            apiFetch(`/${cursoId}/sesiones`),
            apiFetch(`/${cursoId}/inscripciones`)
        ]);
        setCurso(c.data);
        setSesiones(s.data || []);
        setInscripciones(i.data || []);
        setLoading(false);
    }, [cursoId]);

    useEffect(() => { load(); }, [load]);

    const guardarSesion = async () => {
        const method = editSesion ? 'PUT' : 'POST';
        const url = editSesion ? `/sesiones/${editSesion.id}` : `/${cursoId}/sesiones`;
        const r = await apiFetch(url, { method, body: JSON.stringify(sesionForm) });
        if (r.success) { setShowSesionForm(false); setEditSesion(null); setSesionForm({ fecha_sesion: '', hora_inicio: '', hora_fin: '', lugar: '', instructor: '', temas: '', duracion_horas: '' }); load(); }
        else alert('Error: ' + r.error);
    };

    const abrirEditSesion = (s: any) => { setEditSesion(s); setSesionForm({ fecha_sesion: s.fecha_sesion, hora_inicio: s.hora_inicio || '', hora_fin: s.hora_fin || '', lugar: s.lugar || '', instructor: s.instructor || '', temas: s.temas || '', duracion_horas: s.duracion_horas || '' }); setShowSesionForm(true); };

    const eliminarSesion = async (sid: number) => {
        if (!confirm('¿Eliminar esta sesión?')) return;
        await apiFetch(`/sesiones/${sid}`, { method: 'DELETE' });
        load();
    };

    const asistenciaSesion = async (sesionId: number, presente: boolean) => {
        const insIds = inscripciones.map(i => i.id);
        await apiFetch(`/sesiones/${sesionId}/asistencia`, { method: 'POST', body: JSON.stringify({ inscripcion_ids: insIds, presente }) });
        load();
    };

    const calificar = async (iid: number, calificacion: number, estatus: string) => {
        const r = await apiFetch(`/inscripciones/${iid}`, {
            method: 'PUT', body: JSON.stringify({ calificacion, estatus, fecha_completado: estatus === 'completado' ? new Date().toISOString().split('T')[0] : null })
        });
        if (r.success) { setShowEvalForm(false); load(); }
        else alert('Error: ' + r.error);
    };

    const generarCert = async (iid: number, tipo: string) => {
        const r = await apiFetch(`/certificados/${iid}/generar`, { method: 'POST', body: JSON.stringify({ tipo }) });
        if (r.success) alert('Certificado generado: ' + r.data.folio);
        else alert('No se pudo generar: ' + r.error);
    };

    if (loading) return <div style={{ color: 'var(--gray-400)' }}>Cargando…</div>;

    return (
        <div>
            <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 16 }}>← Volver al catálogo</button>

            {curso && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{curso.titulo}</h1>
                            <p style={{ margin: '4px 0 0', color: 'var(--gray-400)' }}>{curso.descripcion}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Badge text={curso.tipo} color={curso.tipo === 'interna' ? 'blue' : 'purple'} />
                            <Badge text={curso.modalidad} color="orange" />
                            <Badge text={curso.estatus} color={curso.estatus === 'activa' ? 'green' : 'gray'} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem' }}>📅</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Fecha</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{curso.fecha_inicio} → {curso.fecha_fin}</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem' }}>⏱️</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Duración</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{curso.duracion_horas} horas</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem' }}>💰</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Costo</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>${Number(curso.costo || 0).toLocaleString()}</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem' }}>👥</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Inscritos</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{inscripciones.length} / {curso.capacidad || '∞'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                        {(['info', 'sesiones', 'inscritos', 'evaluacion'] as const).map(t => (
                            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 16px', background: activeTab === t ? 'var(--primary-600)' : 'transparent', border: 'none', borderRadius: 8, color: 'var(--gray-100)', cursor: 'pointer', fontWeight: activeTab === t ? 600 : 400 }}>
                            {t === 'info' ? 'Info' : t === 'sesiones' ? 'Sesiones' : t === 'inscritos' ? 'Inscritos' : 'Evaluación'}
                        </button>
                        ))}
                    </div>

                    {activeTab === 'info' && (
                        <div className="card">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div><label className="label">Proveedor</label><p style={{ margin: 0 }}>{curso.proveedor || '—'}</p></div>
                                <div><label className="label">Capacidad</label><p style={{ margin: 0 }}>{curso.capacidad || 'Sin límite'}</p></div>
                                <div><label className="label">Fecha inicio</label><p style={{ margin: 0 }}>{curso.fecha_inicio}</p></div>
                                <div><label className="label">Fecha fin</label><p style={{ margin: 0 }}>{curso.fecha_fin}</p></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sesiones' && (
                        <div>
                            {isAdmin && <button className="btn btn-primary" onClick={() => { setEditSesion(null); setSesionForm({ fecha_sesion: '', hora_inicio: '', hora_fin: '', lugar: '', instructor: '', temas: '', duracion_horas: '' }); setShowSesionForm(true); }} style={{ marginBottom: 16 }}>+ Agregar sesión</button>}
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Fecha</th><th>Hora</th><th>Lugar</th><th>Instructor</th><th>Duración</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {sesiones.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Sin sesiones registradas</td></tr> :
                                            sesiones.map(s => (
                                                <tr key={s.id}>
                                                    <td>{s.fecha_sesion}</td>
                                                    <td>{s.hora_inicio || '—'} {s.hora_fin ? `→ ${s.hora_fin}` : ''}</td>
                                                    <td>{s.lugar || '—'}</td>
                                                    <td>{s.instructor || '—'}</td>
                                                    <td>{s.duracion_horas || 0}h</td>
                                                    <td>
                                                        {isAdmin && <>
                                                            <button className="btn btn-secondary" style={{ marginRight: 6, padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => abrirEditSesion(s)}>Editar</button>
                                                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => eliminarSesion(s.id)}>Eliminar</button>
                                                            <button className="btn btn-success" style={{ marginLeft: 6, padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => asistenciaSesion(s.id, true)}>✓ Marcar todos presentes</button>
                                                        </>}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inscritos' && (
                        <div>
                            {isAdmin && <button className="btn btn-primary" onClick={() => setShowInscForm(true)} style={{ marginBottom: 16 }}>+ Inscribir empleados</button>}
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Empleado</th><th>No. Emp.</th><th>Departamento</th><th>Estatus</th><th>Calif.</th><th>Asistencias</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {inscripciones.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Sin inscripciones</td></tr> :
                                            inscripciones.map(i => (
                                                <tr key={i.id}>
                                                    <td>{i.nombre} {i.apellido_paterno}</td>
                                                    <td>{i.numero_empleado}</td>
                                                    <td>{i.departamento || '—'}</td>
                                                    <td><Badge text={i.estatus} color={{ inscrito: 'blue', en_proceso: 'orange', completado: 'green', cancelado: 'gray', reprobado: 'red' }[i.estatus] || 'gray'} /></td>
                                                    <td>{i.calificacion != null ? i.calificacion : '—'}</td>
                                                    <td>{i.sesiones_asistidas || 0}/{i.total_sesiones || 0}</td>
                                                    <td>
                                                        {isAdmin && <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => { setEvalData(i); setShowEvalForm(true); }}>Calificar</button>}
                                                        {i.estatus === 'completado' && (i.certificado_folio ? <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--success)' }}>✓ {i.certificado_folio}</span> :
                                                            <button className="btn btn-success" style={{ marginLeft: 8, padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => generarCert(i.id, 'participacion')}>Generar cert.</button>)}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'evaluacion' && isAdmin && (
                        <EvaluacionView cursoId={cursoId} />
                    )}
                </>
            )}

            {showSesionForm && (
                <Modal title={editSesion ? 'Editar sesión' : 'Nueva sesión'} onClose={() => setShowSesionForm(false)}>
                    <div style={{ display: 'grid', gap: 16 }}>
                        <div className="form-group"><label className="label">Fecha *</label><input className="input" type="date" value={sesionForm.fecha_sesion} onChange={e => setSesionForm({ ...sesionForm, fecha_sesion: e.target.value })} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group"><label className="label">Hora inicio</label><input className="input" type="time" value={sesionForm.hora_inicio} onChange={e => setSesionForm({ ...sesionForm, hora_inicio: e.target.value })} /></div>
                            <div className="form-group"><label className="label">Hora fin</label><input className="input" type="time" value={sesionForm.hora_fin} onChange={e => setSesionForm({ ...sesionForm, hora_fin: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label className="label">Lugar</label><input className="input" value={sesionForm.lugar} onChange={e => setSesionForm({ ...sesionForm, lugar: e.target.value })} /></div>
                        <div className="form-group"><label className="label">Instructor</label><input className="input" value={sesionForm.instructor} onChange={e => setSesionForm({ ...sesionForm, instructor: e.target.value })} /></div>
                        <div className="form-group"><label className="label">Temas</label><textarea className="input" rows={3} value={sesionForm.temas} onChange={e => setSesionForm({ ...sesionForm, temas: e.target.value })} /></div>
                        <div className="form-group"><label className="label">Duración (horas)</label><input className="input" type="number" value={sesionForm.duracion_horas} onChange={e => setSesionForm({ ...sesionForm, duracion_horas: e.target.value })} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setShowSesionForm(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={guardarSesion}>{editSesion ? 'Guardar' : 'Agregar'}</button>
                    </div>
                </Modal>
            )}

            {showInscForm && <InscripcionForm cursoId={cursoId} onClose={() => { setShowInscForm(false); load(); }} />}

            {showEvalForm && evalData && (
                <Modal title="Calificar / Actualizar" onClose={() => setShowEvalForm(false)}>
                    <div style={{ display: 'grid', gap: 16 }}>
                        <p style={{ margin: 0 }}><strong>{evalData.nombre} {evalData.apellido_paterno}</strong> — {evalData.numero_empleado}</p>
                        <div className="form-group">
                            <label className="label">Calificación (0-100)</label>
                            <input className="input" type="number" min={0} max={100} defaultValue={evalData.calificacion || ''} id="eval-calif" />
                        </div>
                        <div className="form-group">
                            <label className="label">Estatus</label>
                            <select className="input" defaultValue={evalData.estatus} id="eval-estatus">
                                <option value="inscrito">Inscrito</option>
                                <option value="en_proceso">En proceso</option>
                                <option value="completado">Completado</option>
                                <option value="reprobado">Reprobado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                        <div className="form-group"><label className="label">Observaciones</label><textarea className="input" rows={2} id="eval-obs" defaultValue={evalData.observaciones || ''} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setShowEvalForm(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={() => {
                            const calif = (document.getElementById('eval-calif') as HTMLInputElement).value;
                            const estatus = (document.getElementById('eval-estatus') as HTMLSelectElement).value;
                            const obs = (document.getElementById('eval-obs') as HTMLTextAreaElement).value;
                            calificar(evalData.id, Number(calif), estatus);
                        }}>Guardar</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ── FORMULARIO DE INSCRIPCIÓN ───────────────────────────
const InscripcionForm: React.FC<{ cursoId: number; onClose: () => void }> = ({ cursoId, onClose }) => {
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [deptos, setDeptos] = useState<string[]>([]);
    const [deptoFiltro, setDeptoFiltro] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/empleados').then(r => r.json()).then(j => {
            if (j.success) { setEmpleados(j.data || []); setDeptos([...new Set((j.data || []).map((e: any) => e.departamento).filter(Boolean))]); }
            setLoading(false);
        });
    }, []);

    const filtrados = deptos ? empleados.filter((e: any) => !deptoFiltro || e.departamento === deptoFiltro) : empleados;

    const toggle = (id: number) => setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const inscribir = async () => {
        if (seleccionados.length === 0) return alert('Selecciona al menos un empleado');
        const r = await apiFetch(`/${cursoId}/inscribir`, { method: 'POST', body: JSON.stringify({ empleado_ids: seleccionados }) });
        if (r.success) { alert(`Inscritos: ${r.data.length}`); onClose(); }
        else alert('Error: ' + r.error);
    };

    return (
        <Modal title="Inscribir empleados" onClose={onClose} wide>
            <div style={{ marginBottom: 16 }}>
                <select className="input" value={deptoFiltro} onChange={e => setDeptoFiltro(e.target.value)} style={{ width: 200 }}>
                    <option value="">Todos los departamentos</option>
                    {deptos.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <span style={{ marginLeft: 12, color: 'var(--gray-400)', fontSize: '0.85rem' }}>{seleccionados.length} seleccionados</span>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
                {loading ? <p style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)' }}>Cargando…</p> :
                    filtrados.map((e: any) => (
                        <div key={e.id} onClick={() => toggle(e.id)} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: seleccionados.includes(e.id) ? 'rgba(14,165,233,0.1)' : 'transparent' }}>
                            <input type="checkbox" checked={seleccionados.includes(e.id)} readOnly style={{ margin: 'auto 0' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{e.nombre} {e.apellido_paterno}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{e.numero_empleado} · {e.departamento} · {e.puesto}</div>
                            </div>
                        </div>
                    ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                <button className="btn btn-primary" onClick={inscribir}>Inscribir ({seleccionados.length})</button>
            </div>
        </Modal>
    );
};

// ── EVALUACIÓN / REPORTE ───────────────────────────────
const EvaluacionView: React.FC<{ cursoId: number }> = ({ cursoId }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch(`/reportes/evaluacion/${cursoId}`).then(r => { setData(r.data); setLoading(false); });
    }, [cursoId]);

    if (loading) return <p style={{ color: 'var(--gray-400)' }}>Cargando…</p>;
    if (!data) return null;

    const { stats, empleados } = data;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-400)' }}>{stats.total}</div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Total inscritos</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{stats.promedio.toFixed(1)}</div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Promedio calificación</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{stats.aprobados}</div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Aprobados</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--error)' }}>{stats.reprobados}</div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Reprobados</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--info)' }}>{stats.completados}</div><div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Completados</div></div>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead><tr><th>Empleado</th><th>No. Emp.</th><th>Depto.</th><th>Estatus</th><th>Calif.</th><th>Asistencias</th></tr></thead>
                    <tbody>
                        {empleados.map((e: any) => (
                            <tr key={e.id}>
                                <td>{e.nombre} {e.apellido_paterno}</td>
                                <td>{e.numero_empleado}</td>
                                <td>{e.departamento || '—'}</td>
                                <td><Badge text={e.estatus} color={{ inscrito: 'blue', en_proceso: 'orange', completado: 'green', reprobado: 'red', cancelado: 'gray' }[e.estatus] || 'gray'} /></td>
                                <td style={{ fontWeight: 600, color: Number(e.calif) >= 70 ? 'var(--success)' : 'var(--error)' }}>{e.calif || '—'}</td>
                                <td>{e.sesiones_asistidas || 0}/{e.total_sesiones || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ── MIS CURSOS (empleado) ───────────────────────────────
const MisCursosView: React.FC = () => {
    const { user } = useSession();
    const [cursos, setCursos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.numeroEmpleado) return;
        fetch(`/api/empleados`).then(r => r.json()).then(async j => {
            if (!j.success) return;
            const emp = (j.data || []).find((e: any) => e.numero_empleado === user.numeroEmpleado);
            if (!emp) { setLoading(false); return; }
            const r = await apiFetch(`/empleado/${emp.id}`);
            setCursos(r.data || []);
            setLoading(false);
        });
    }, [user]);

    if (!user?.numeroEmpleado) return <p style={{ color: 'var(--gray-400)' }}>No tienes un número de empleado asignado.</p>;
    if (loading) return <p style={{ color: 'var(--gray-400)' }}>Cargando…</p>;

    const badgeColor = (e: string) => ({ completado: 'green', en_proceso: 'orange', inscrito: 'blue', reprobado: 'red', cancelado: 'gray' }[e] || 'gray');

    return (
        <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.8rem' }}>📖 Mis cursos</h1>
            <p style={{ margin: '0 0 24px', color: 'var(--gray-400)' }}>Historial de capacitaciones en las que estás inscrito</p>
            {cursos.length === 0 ? (
                <div className="card empty-state"><div className="empty-icon">📚</div><h3>Sin cursos registrados</h3><p>Aún no te has inscrito en ninguna capacitación</p></div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Curso</th><th>Fecha</th><th>Modalidad</th><th>Estatus</th><th>Calif.</th><th>Asistencias</th><th>Certificado</th></tr></thead>
                        <tbody>
                            {cursos.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{c.titulo}</strong></td>
                                    <td>{c.fecha_inicio} → {c.fecha_fin}</td>
                                    <td><Badge text={c.modalidad} color="orange" /></td>
                                    <td><Badge text={c.estatus} color={badgeColor(c.estatus)} /></td>
                                    <td style={{ fontWeight: 600 }}>{c.calificacion != null ? c.calificacion : '—'}</td>
                                    <td>{c.sesiones_asistidas || 0}/{c.total_sesiones || 0}</td>
                                    <td>{c.certificado_folio ? <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>✓ {c.certificado_folio}</span> : <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>—</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ── REPORTES ───────────────────────────────────────────
const ReportesView: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { apiFetch('/reportes/resumen').then(r => { setData(r.data); setLoading(false); }); }, []);

    if (loading) return <p style={{ color: 'var(--gray-400)' }}>Cargando…</p>;
    if (!data) return null;

    return (
        <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.8rem' }}>📊 Reportes</h1>
            <p style={{ margin: '0 0 24px', color: 'var(--gray-400)' }}>Resumen de capacitación en toda la empresa</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-400)' }}>{data.total_capacitaciones}</div><div style={{ color: 'var(--gray-400)' }}>Capacitaciones activas</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-400)' }}>{data.total_inscripciones}</div><div style={{ color: 'var(--gray-400)' }}>Inscripciones totales</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>{data.completados}</div><div style={{ color: 'var(--gray-400)' }}>Completados</div></div>
                <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--warning)' }}>${Number(data.costo_total || 0).toLocaleString()}</div><div style={{ color: 'var(--gray-400)' }}>Costo total</div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Por modalidad</h3>
                    {data.por_modalidad.length === 0 ? <p style={{ color: 'var(--gray-400)' }}>Sin datos</p> :
                        data.por_modalidad.map((m: any) => (
                            <div key={m.modalidad} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ textTransform: 'capitalize' }}>{m.modalidad}</span>
                                <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{m.total}</span>
                            </div>
                        ))}
                </div>
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Por departamento</h3>
                    {data.por_departamento.length === 0 ? <p style={{ color: 'var(--gray-400)' }}>Sin datos</p> :
                        data.por_departamento.map((d: any) => (
                            <div key={d.departamento} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span>{d.departamento || 'Sin depto.'}</span>
                                <span><span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{d.empleados_capacitados}</span> <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>({d.inscripciones} insp.)</span></span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

// ── COMPONENTE PRINCIPAL ───────────────────────────────
const CapacitacionesModule: React.FC = () => {
    const [tab, setTab] = useState<'catalogo' | 'mis-cursos' | 'reportes'>('catalogo');
    const [detalleId, setDetalleId] = useState<number | null>(null);
    const { user } = useSession();
    const isAdmin = user?.esAdministrador;

    if (detalleId !== null) return <DetalleView cursoId={detalleId} onBack={() => setDetalleId(null)} />;

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                <button onClick={() => setTab('catalogo')} style={{ padding: '8px 16px', background: tab === 'catalogo' ? 'var(--primary-600)' : 'transparent', border: 'none', borderRadius: 8, color: 'var(--gray-100)', cursor: 'pointer', fontWeight: tab === 'catalogo' ? 600 : 400 }}>📚 Catálogo</button>
                <button onClick={() => setTab('mis-cursos')} style={{ padding: '8px 16px', background: tab === 'mis-cursos' ? 'var(--primary-600)' : 'transparent', border: 'none', borderRadius: 8, color: 'var(--gray-100)', cursor: 'pointer', fontWeight: tab === 'mis-cursos' ? 600 : 400 }}>📖 Mis cursos</button>
                {isAdmin && <button onClick={() => setTab('reportes')} style={{ padding: '8px 16px', background: tab === 'reportes' ? 'var(--primary-600)' : 'transparent', border: 'none', borderRadius: 8, color: 'var(--gray-100)', cursor: 'pointer', fontWeight: tab === 'reportes' ? 600 : 400 }}>📊 Reportes</button>}
            </div>
            {tab === 'catalogo' && <CatalogoView onVerDetalle={setDetalleId} />}
            {tab === 'mis-cursos' && <MisCursosView />}
            {tab === 'reportes' && <ReportesView />}
        </div>
    );
};

export default CapacitacionesModule;
