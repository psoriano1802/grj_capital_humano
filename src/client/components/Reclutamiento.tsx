import React, { useState, useEffect, useCallback } from 'react';
import './Reclutamiento.css';

// ── API helpers ──────────────────────────────────────────────
const BASE = '/api/reclutamiento';
const apiFetch = async (path: string, opts?: RequestInit) => {
    try {
        const res = await fetch(`${BASE}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            ...opts,
        });
        const json = await res.json();
        if (!res.ok) return { success: false, error: json.error ?? `Error ${res.status}`, data: null };
        return json;
    } catch {
        return { success: false, error: 'Sin conexión con el servidor', data: null };
    }
};


// ── Constantes ───────────────────────────────────────────────
const ETAPAS = [
    { key: 'CAPTURA',      label: 'Captura',      icon: '📥' },
    { key: 'ENTREVISTA',   label: 'Entrevista',   icon: '🎙️' },
    { key: 'PRUEBAS',      label: 'Pruebas',      icon: '📝' },
    { key: 'RESULTADOS',   label: 'Resultados',   icon: '📊' },
    { key: 'CONTRATACION', label: 'Contratación', icon: '✅' },
];

const ETAPA_IDX: Record<string, number> = Object.fromEntries(ETAPAS.map((e, i) => [e.key, i]));

// ── Sub-components ───────────────────────────────────────────

/** Timeline horizontal de etapas del candidato */
const EtapaTimeline: React.FC<{ etapaActual: string }> = ({ etapaActual }) => {
    const idx = ETAPA_IDX[etapaActual] ?? 0;
    return (
        <div className="etapas-timeline">
            {ETAPAS.map((e, i) => (
                <div
                    key={e.key}
                    className={`etapa-step ${i < idx ? 'done' : i === idx ? 'current' : ''}`}
                >
                    <div className="etapa-dot">{i < idx ? '✓' : e.icon}</div>
                    <div className="etapa-label">{e.label}</div>
                </div>
            ))}
        </div>
    );
};

/** Chip de estatus */
const StatusChip: React.FC<{ estatus: string }> = ({ estatus }) => (
    <span className={`chip chip-${estatus}`}>{estatus.replace('_', ' ')}</span>
);

/** Modal genérico */
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="rec-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="rec-modal">
            <div className="rec-modal-header">
                <span className="rec-modal-title">{title}</span>
                <button className="btn-icon" onClick={onClose}>✕</button>
            </div>
            {children}
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────
// COMPONENTE: FILE UPLOAD
// ────────────────────────────────────────────────────────────
interface FileUploadProps {
    /** Callback con la URL del archivo ya subido */
    onUploaded: (url: string, nombre: string) => void;
    /** Texto del label */
    label?: string;
    /** Tipos aceptados por el explorador */
    accept?: string;
    /** URL ya existente (para mostrar link si ya hay archivo) */
    existingUrl?: string;
    existingName?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onUploaded, label = 'Subir archivo', accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png', existingUrl, existingName
}) => {
    const [drag, setDrag]       = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress]   = useState(0);
    const [uploaded, setUploaded]   = useState<{ url: string; nombre: string } | null>(
        existingUrl ? { url: existingUrl, nombre: existingName ?? existingUrl.split('/').pop() ?? 'Archivo' } : null
    );
    const [error, setError] = useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        if (!file) return;
        setError(null);
        setUploading(true);
        setProgress(10);

        const formData = new FormData();
        formData.append('archivo', file);

        try {
            // Simula progreso mientras sube
            const interval = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 300);
            const res = await fetch('/api/reclutamiento/upload', { method: 'POST', body: formData });
            clearInterval(interval);
            const json = await res.json();
            setProgress(100);
            if (json.success) {
                setUploaded({ url: json.data.url, nombre: json.data.nombre });
                onUploaded(json.data.url, json.data.nombre);
                setTimeout(() => setProgress(0), 600);
            } else {
                setError(json.error ?? 'Error al subir el archivo');
                setProgress(0);
            }
        } catch {
            setError('Sin conexión con el servidor');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    }, [onUploaded]);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDrag(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div>
            <div
                className={`file-upload-zone ${drag ? 'drag-over' : ''} ${uploaded ? 'has-file' : ''} ${error ? 'has-error' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                <input ref={inputRef} type="file" accept={accept} onChange={onInputChange} onClick={e => e.stopPropagation()} />
                {uploading ? (
                    <>
                        <div className="file-upload-icon">⏳</div>
                        <div className="file-upload-label">Subiendo archivo…</div>
                        <div className="file-upload-progress" style={{ width: '60%', margin: '8px auto 0' }}>
                            <div className="file-upload-progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                    </>
                ) : uploaded ? (
                    <>
                        <div className="file-upload-icon">✅</div>
                        <div className="file-upload-label"><strong>Archivo listo</strong></div>
                        <div className="file-upload-hint">Haz clic para reemplazar</div>
                    </>
                ) : (
                    <>
                        <div className="file-upload-icon">📁</div>
                        <div className="file-upload-label"><strong>Arrastra un archivo</strong> o haz clic para explorar</div>
                        <div className="file-upload-hint">{label} &bull; PDF, Word, JPG, PNG &bull; Máx. 10 MB</div>
                    </>
                )}
            </div>

            {/* Resultado subido */}
            {uploaded && !uploading && (
                <div className="file-upload-result">
                    <div className="file-upload-result-icon">
                        {uploaded.nombre.match(/\.(jpg|jpeg|png|webp)/i) ? '🖼️' : '📄'}
                    </div>
                    <div className="file-upload-result-info">
                        <div className="file-upload-result-name">{uploaded.nombre}</div>
                    </div>
                    <a href={uploaded.url} target="_blank" rel="noreferrer" className="doc-view-link" onClick={e => e.stopPropagation()}>
                        👁️ Ver
                    </a>
                </div>
            )}

            {error && <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '6px' }}>⚠️ {error}</div>}
        </div>
    );
};

// ────────────────────────────────────────────────────────────
// VISTA: CATÁLOGOS
// ────────────────────────────────────────────────────────────
const CATALOGO_META: Record<string, { label: string; desc: string }> = {
    fuente_reclutamiento: { label: 'Fuentes de reclutamiento',     desc: 'Origen del candidato' },
    estatus_aspirante:    { label: 'Estatus del aspirante',         desc: 'Seguimiento del avance del candidato' },
    tipo_entrevista:      { label: 'Tipos de entrevista',           desc: 'Clasifica la modalidad de entrevista' },
    etapa_proceso:        { label: 'Etapas del proceso',            desc: 'Fases del flujo de reclutamiento' },
    doc_aspirante:        { label: 'Tipos de documentos',           desc: 'Documentación requerida en expediente' },
    tipo_prueba:          { label: 'Tipos de pruebas',              desc: 'Evaluaciones aplicables al aspirante' },
    resultado_prueba:     { label: 'Resultado de pruebas',          desc: 'Resultado final o parcial' },
    motivo_rechazo:       { label: 'Motivos de rechazo/cancelación', desc: 'Causas para no continuar el proceso' },
};

const CatalogosView: React.FC = () => {
    const [cats, setCats] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/catalogos').then(r => {
            if (r.success) setCats(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><p>Cargando catálogos…</p></div>;

    return (
        <div>
            <div className="section-header">
                <h1>📚 Catálogos de Reclutamiento</h1>
                <p>Los 8 catálogos configurados para el proceso de selección</p>
            </div>
            <div className="catalogo-grid">
                {Object.entries(CATALOGO_META).map(([cat, meta]) => (
                    <div key={cat} className="catalogo-card">
                        <div className="catalogo-card-header">
                            <div className="catalogo-card-title">{meta.label}</div>
                            <div className="catalogo-card-desc">{meta.desc}</div>
                        </div>
                        <div className="catalogo-items">
                            {(cats[cat] ?? []).map(item => (
                                <div key={item.clave} className="catalogo-item">
                                    <span className="catalogo-item-badge">{item.clave}</span>
                                    <div>
                                        <div className="catalogo-item-text">{item.valor}</div>
                                        {item.descripcion && <div className="catalogo-item-desc">{item.descripcion}</div>}
                                    </div>
                                </div>
                            ))}
                            {!cats[cat]?.length && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>
                                    Sin registros — ejecuta el SQL de reclutamiento
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────────────────
// VISTA: VACANTES
// ────────────────────────────────────────────────────────────
const VacantesView: React.FC<{ onSelectVacante: (v: any) => void }> = ({ onSelectVacante }) => {
    const [vacantes, setVacantes]     = useState<any[]>([]);
    const [stats, setStats]           = useState<any>({});
    const [showForm, setShowForm]     = useState(false);
    const [form, setForm]             = useState<any>({ titulo: '', departamento: '', modalidad: 'presencial', num_plazas: 1 });
    const [loading, setLoading]       = useState(true);

    const load = useCallback(async () => {
        const [v, s] = await Promise.all([
            apiFetch('/vacantes'),
            apiFetch('/vacantes/estadisticas'),
        ]);
        if (v.success) setVacantes(v.data ?? []);
        if (s.success) setStats(s.data ?? {});
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await apiFetch('/vacantes', { method: 'POST', body: JSON.stringify(form) });
        if (r.success) { setShowForm(false); setForm({ titulo: '', departamento: '', modalidad: 'presencial', num_plazas: 1 }); load(); }
    };

    const cambiarEstatus = async (id: number, estatus: string) => {
        await apiFetch(`/vacantes/${id}/estatus`, { method: 'PATCH', body: JSON.stringify({ estatus }) });
        load();
    };

    if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><p>Cargando vacantes…</p></div>;

    return (
        <div>
            <div className="section-header">
                <h1>📋 Vacantes</h1>
                <p>Gestión de plazas disponibles para reclutamiento</p>
            </div>

            {/* Stats */}
            <div className="rec-stats-row">
                {[
                    { label: 'Activas',    val: stats.activas    ?? 0, color: 'var(--success)' },
                    { label: 'Pausadas',   val: stats.pausadas   ?? 0, color: '#fbbf24' },
                    { label: 'Cerradas',   val: stats.cerradas   ?? 0, color: 'var(--gray-500)' },
                    { label: 'Total',      val: stats.total      ?? 0, color: 'var(--primary-400)' },
                ].map(s => (
                    <div key={s.label} className="rec-stat-card">
                        <div className="rec-stat-value" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
                        <div className="rec-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-lg">
                <div />
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    ➕ Nueva Vacante
                </button>
            </div>

            {/* Grid de Vacantes */}
            <div className="grid grid-2">
                {vacantes.map(v => (
                    <div key={v.id} className="vacante-card">
                        <div className="vacante-titulo">{v.titulo}</div>
                        <div className="vacante-depto">🏢 {v.departamento || 'Sin departamento'}</div>
                        <div className="vacante-info">
                            <span className="vacante-info-item">👥 {v.num_plazas} plaza{v.num_plazas !== 1 ? 's' : ''}</span>
                            <span className="vacante-info-item">💼 {v.modalidad}</span>
                            {v.salario_min && <span className="vacante-info-item">💰 ${Number(v.salario_min).toLocaleString()}{v.salario_max ? ` – $${Number(v.salario_max).toLocaleString()}` : ''}</span>}
                            <StatusChip estatus={v.estatus} />
                        </div>
                        <div className="vacante-actions">
                            <button className="btn btn-primary btn-sm" onClick={() => onSelectVacante(v)}>
                                Ver Aspirantes
                            </button>
                            {v.estatus === 'activa' && (
                                <button className="btn btn-secondary btn-sm" onClick={() => cambiarEstatus(v.id, 'pausada')}>
                                    ⏸ Pausar
                                </button>
                            )}
                            {v.estatus === 'pausada' && (
                                <button className="btn btn-success btn-sm" onClick={() => cambiarEstatus(v.id, 'activa')}>
                                    ▶ Activar
                                </button>
                            )}
                            {(v.estatus === 'activa' || v.estatus === 'pausada') && (
                                <button className="btn btn-danger btn-sm" onClick={() => cambiarEstatus(v.id, 'cerrada')}>
                                    🔒 Cerrar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {!vacantes.length && (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                        <div className="empty-icon">📋</div>
                        <h3>Sin vacantes registradas</h3>
                        <p>Crea la primera vacante usando el botón de arriba</p>
                    </div>
                )}
            </div>

            {/* Modal crear vacante */}
            {showForm && (
                <Modal title="➕ Nueva Vacante" onClose={() => setShowForm(false)}>
                    <form className="form" onSubmit={handleCreate}>
                        <div className="form-group">
                            <label className="label">Título del puesto *</label>
                            <input className="input" required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Desarrollador Full Stack" />
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Departamento</label>
                                <input className="input" value={form.departamento} onChange={e => setForm({ ...form, departamento: e.target.value })} placeholder="Ej: Tecnología" />
                            </div>
                            <div className="form-group">
                                <label className="label">Modalidad</label>
                                <select className="input" value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}>
                                    <option value="presencial">Presencial</option>
                                    <option value="remoto">Remoto</option>
                                    <option value="hibrido">Híbrido</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Salario mínimo</label>
                                <input type="number" className="input" value={form.salario_min || ''} onChange={e => setForm({ ...form, salario_min: e.target.value })} placeholder="15000" />
                            </div>
                            <div className="form-group">
                                <label className="label">Salario máximo</label>
                                <input type="number" className="input" value={form.salario_max || ''} onChange={e => setForm({ ...form, salario_max: e.target.value })} placeholder="25000" />
                            </div>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Número de plazas</label>
                                <input type="number" min={1} className="input" value={form.num_plazas} onChange={e => setForm({ ...form, num_plazas: Number(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Fecha de cierre</label>
                                <input type="date" className="input" value={form.fecha_cierre || ''} onChange={e => setForm({ ...form, fecha_cierre: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Descripción</label>
                            <textarea className="input" rows={3} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe el puesto…" />
                        </div>
                        <div className="form-group">
                            <label className="label">Requisitos</label>
                            <textarea className="input" rows={3} value={form.requisitos || ''} onChange={e => setForm({ ...form, requisitos: e.target.value })} placeholder="Lista los requisitos del perfil…" />
                        </div>
                        <div className="flex gap-md">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>💾 Guardar Vacante</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────────────────
// VISTA: PIPELINE KANBAN
// ────────────────────────────────────────────────────────────
const PipelineView: React.FC<{ vacanteId?: number; onSelectAspirante: (a: any) => void }> = ({ vacanteId, onSelectAspirante }) => {
    const [pipeline, setPipeline] = useState<Record<string, any[]>>({});
    const [showForm, setShowForm] = useState(false);
    const [cats, setCats]         = useState<Record<string, any[]>>({});
    const [form, setForm]         = useState<any>({ nombre: '', apellido_paterno: '', email: '', fuente_reclutamiento: 'BOLSA' });
    const [loading, setLoading]   = useState(true);

    const load = useCallback(async () => {
        const path = vacanteId ? `/pipeline?vacante_id=${vacanteId}` : '/pipeline';
        const [p, c] = await Promise.all([apiFetch(path), apiFetch('/catalogos')]);
        if (p.success) setPipeline(p.data ?? {});
        if (c.success) setCats(c.data ?? {});
        setLoading(false);
    }, [vacanteId]);

    useEffect(() => { load(); }, [load]);

    const handleCreateAspirante = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = vacanteId ? { ...form, vacante_id: vacanteId } : form;
        const r = await apiFetch('/aspirantes', { method: 'POST', body: JSON.stringify(payload) });
        if (r.success) { setShowForm(false); setForm({ nombre: '', apellido_paterno: '', email: '', fuente_reclutamiento: 'BOLSA' }); load(); }
    };

    if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><p>Cargando pipeline…</p></div>;

    const total = Object.values(pipeline).reduce((s, arr) => s + arr.length, 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-100)' }}>
                        🎯 Pipeline de Candidatos
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>{total} candidato{total !== 1 ? 's' : ''} activo{total !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>➕ Nuevo Aspirante</button>
            </div>

            <div className="pipeline-wrapper">
                {ETAPAS.map(etapa => {
                    const items = pipeline[etapa.key] ?? [];
                    return (
                        <div key={etapa.key} className={`pipeline-col col-${etapa.key}`}>
                            <div className="pipeline-col-header">
                                <span>{etapa.icon} {etapa.label}</span>
                                <span className="pipeline-badge">{items.length}</span>
                            </div>
                            <div className="pipeline-col-body">
                                {items.map(a => (
                                    <div key={a.id} className="aspirante-card" onClick={() => onSelectAspirante(a)}>
                                        <div className="aspirante-name">{a.nombre} {a.apellido_paterno}</div>
                                        <div className="aspirante-meta">
                                            {a.vacante_titulo && <span className="aspirante-tag">📋 {a.vacante_titulo}</span>}
                                            {a.fuente_reclutamiento && <span className="aspirante-tag">🔗 {a.fuente_reclutamiento}</span>}
                                        </div>
                                    </div>
                                ))}
                                {!items.length && (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--gray-700)', fontSize: '0.8rem' }}>
                                        Sin candidatos
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal nuevo aspirante */}
            {showForm && (
                <Modal title="👤 Registrar Aspirante" onClose={() => setShowForm(false)}>
                    <form className="form" onSubmit={handleCreateAspirante}>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Nombre *</label>
                                <input className="input" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Apellido Paterno *</label>
                                <input className="input" required value={form.apellido_paterno} onChange={e => setForm({ ...form, apellido_paterno: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Apellido Materno</label>
                                <input className="input" value={form.apellido_materno || ''} onChange={e => setForm({ ...form, apellido_materno: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Email *</label>
                                <input type="email" className="input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Teléfono</label>
                                <input className="input" value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="55 0000 0000" />
                            </div>
                            <div className="form-group">
                                <label className="label">Salario pretendido</label>
                                <input type="number" className="input" value={form.salario_pretendido || ''} onChange={e => setForm({ ...form, salario_pretendido: e.target.value })} placeholder="20000" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Fuente de reclutamiento</label>
                            <select className="input" value={form.fuente_reclutamiento} onChange={e => setForm({ ...form, fuente_reclutamiento: e.target.value })}>
                                {(cats['fuente_reclutamiento'] ?? []).map(c => (
                                    <option key={c.clave} value={c.clave}>{c.valor}</option>
                                ))}
                                {!cats['fuente_reclutamiento']?.length && <option value="BOLSA">Bolsa de trabajo</option>}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">CV del aspirante</label>
                            <FileUpload
                                label="Currículum Vitae"
                                accept=".pdf,.doc,.docx"
                                onUploaded={(url) => setForm({ ...form, cv_url: url })}
                                existingUrl={form.cv_url || undefined}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Notas</label>
                            <textarea className="input" rows={2} value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones iniciales…" />
                        </div>
                        <div className="flex gap-md">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>💾 Registrar</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────────────────
// VISTA: DETALLE ASPIRANTE
// ────────────────────────────────────────────────────────────
const AspiranteDetail: React.FC<{ aspirante: any; onBack: () => void; cats: Record<string, any[]>; onRefresh: () => void; onContratarAspirante?: (a: any) => void }> = ({ aspirante: initAsp, onBack, cats, onRefresh, onContratarAspirante }) => {
    const [asp, setAsp]               = useState<any>(initAsp);
    const [entrevistas, setEntrevistas] = useState<any[]>([]);
    const [pruebas, setPruebas]       = useState<any[]>([]);
    const [documentos, setDocumentos] = useState<any[]>([]);
    const [tab, setTab]               = useState<'info' | 'entrevistas' | 'pruebas' | 'documentos'>('info');
    const [showEntForm, setShowEntForm] = useState(false);
    const [showPruebaForm, setShowPruebaForm] = useState(false);
    const [showRechazarForm, setShowRechazarForm] = useState(false);
    const [entForm, setEntForm]       = useState<any>({ tipo: 'PRESENCIAL', duracion_min: 60 });
    const [prForm, setPrForm]         = useState<any>({ tipo_prueba: 'PSICOMETRICA', fecha_aplicacion: new Date().toISOString().split('T')[0] });
    const [rechMotivo, setRechMotivo] = useState('');

    const load = useCallback(async () => {
        const [e, p, d] = await Promise.all([
            apiFetch(`/aspirantes/${asp.id}/entrevistas`),
            apiFetch(`/aspirantes/${asp.id}/pruebas`),
            apiFetch(`/aspirantes/${asp.id}/documentos`),
        ]);
        if (e.success) setEntrevistas(e.data);
        if (p.success) setPruebas(p.data);
        if (d.success) setDocumentos(d.data);
    }, [asp.id]);

    useEffect(() => { load(); }, [load]);

    const aprobar = async () => {
        const r = await apiFetch(`/aspirantes/${asp.id}/aprobar`, { method: 'PUT' });
        if (r.success) { setAsp(r.data); onRefresh(); }
    };

    const rechazar = async () => {
        if (!rechMotivo) return;
        const r = await apiFetch(`/aspirantes/${asp.id}/rechazar`, { method: 'PUT', body: JSON.stringify({ motivo: rechMotivo }) });
        if (r.success) { setAsp(r.data); setShowRechazarForm(false); onRefresh(); }
    };

    // Traspaso del aspirante aprobado al modulo de empleados
    const contratar = async () => {
        if (!confirm(`¿Pasar a ${asp.nombre} ${asp.apellido_paterno} al módulo de Empleados? Se crearán sus datos básicos para completar la captura.`)) return;
        try {
            const res = await fetch('/api/empleados/desde-aspirante', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aspirante_id: asp.id }),
            });
            const data = await res.json();
            if (data.success) {
                if (onContratarAspirante) {
                    onContratarAspirante(data.data);
                } else {
                    alert(data.ya_existia
                        ? 'ℹ️ Ese aspirante ya había sido contratado.'
                        : '✅ Empleado creado. Ábrelo en el módulo de Empleados para completar sus datos.');
                }
            } else {
                alert('❌ ' + (data.error || 'No se pudo contratar al aspirante.'));
            }
        } catch (e: any) {
            alert('❌ Error de conexión al contratar aspirante.');
        }
    };

    const crearEntrevista = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await apiFetch('/entrevistas', { method: 'POST', body: JSON.stringify({ ...entForm, aspirante_id: asp.id }) });
        if (r.success) { setShowEntForm(false); setAsp((a: any) => ({ ...a, estatus: 'ENTREVISTA', etapa_actual: 'ENTREVISTA' })); load(); onRefresh(); }
    };

    const crearPrueba = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = await apiFetch('/pruebas', { method: 'POST', body: JSON.stringify({ ...prForm, aspirante_id: asp.id }) });
        if (r.success) { setShowPruebaForm(false); setAsp((a: any) => ({ ...a, estatus: 'EVALUADO', etapa_actual: 'PRUEBAS' })); load(); onRefresh(); }
    };


    const docEstatus: Record<string, string> = {};
    documentos.forEach(d => { docEstatus[d.tipo_documento] = d.estatus; });

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-md mb-xl">
                <button className="btn btn-ghost btn-sm" onClick={onBack}>← Volver</button>
                <div style={{ flex: 1 }} />
                {asp.estatus === 'APROBADO' && (
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={contratar}>➡️ Pasar a Empleados</button>
                )}
                {asp.estatus !== 'APROBADO' && asp.estatus !== 'RECHAZADO' && (
                    <>
                        <button className="btn btn-success btn-sm" onClick={aprobar}>✅ Aprobar candidato</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setShowRechazarForm(true)}>❌ Rechazar</button>
                    </>
                )}
            </div>

            {/* Panel de Detalle */}
            <div className="detail-panel mb-xl">
                <div className="detail-header">
                    <div className="detail-avatar">👤</div>
                    <div>
                        <div className="detail-nombre">{asp.nombre} {asp.apellido_paterno} {asp.apellido_materno ?? ''}</div>
                        <div className="detail-sub">{asp.email} {asp.telefono ? `· ${asp.telefono}` : ''}</div>
                        <div className="detail-sub" style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <StatusChip estatus={asp.estatus} />
                            {asp.vacante_titulo && <span className="aspirante-tag">📋 {asp.vacante_titulo}</span>}
                            {asp.fuente_reclutamiento && <span className="aspirante-tag">🔗 {asp.fuente_reclutamiento}</span>}
                            {asp.salario_pretendido && <span className="aspirante-tag">💰 ${Number(asp.salario_pretendido).toLocaleString()}</span>}
                        </div>
                    </div>
                </div>
                <div className="detail-body">
                    <EtapaTimeline etapaActual={asp.etapa_actual ?? 'CAPTURA'} />
                    {asp.motivo_rechazo && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--error)' }}>
                            ⚠️ <strong>Motivo de rechazo:</strong> {asp.motivo_rechazo}
                        </div>
                    )}
                    {asp.notas && <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>{asp.notas}</p>}
                </div>
            </div>

            {/* Tabs */}
            <div className="rec-tabs">
                {([
                    { key: 'info',        label: '📋 Información' },
                    { key: 'entrevistas', label: `🎙️ Entrevistas (${entrevistas.length})` },
                    { key: 'pruebas',     label: `📝 Pruebas (${pruebas.length})` },
                    { key: 'documentos',  label: `📁 Documentos (${documentos.length})` },
                ] as const).map(t => (
                    <button key={t.key} className={`rec-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* TAB: INFO */}
            {tab === 'info' && (
                <div className="card">
                    <div className="grid grid-2">
                        {[
                            ['Nombre completo', `${asp.nombre} ${asp.apellido_paterno} ${asp.apellido_materno ?? ''}`],
                            ['Email', asp.email],
                            ['Teléfono', asp.telefono ?? '—'],
                            ['Fecha nacimiento', asp.fecha_nacimiento ? new Date(asp.fecha_nacimiento).toLocaleDateString('es-MX') : '—'],
                            ['Fuente reclutamiento', asp.fuente_reclutamiento ?? '—'],
                            ['Salario pretendido', asp.salario_pretendido ? `$${Number(asp.salario_pretendido).toLocaleString()}` : '—'],
                            ['Disponibilidad', asp.disponibilidad ?? '—'],
                            ['Fecha registro', asp.created_at ? new Date(asp.created_at).toLocaleDateString('es-MX') : '—'],
                        ].map(([label, val]) => (
                            <div key={label as string} className="form-group">
                                <label className="label">{label as string}</label>
                                <div style={{ fontSize: '0.9rem', color: 'var(--gray-200)', padding: '0.4rem 0' }}>{val as string}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: ENTREVISTAS */}
            {tab === 'entrevistas' && (
                <div>
                    <div className="flex justify-between items-center mb-lg">
                        <span style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>Historial de entrevistas</span>
                        <button className="btn btn-purple btn-sm" onClick={() => setShowEntForm(true)}>🎙️ Programar Entrevista</button>
                    </div>
                    {entrevistas.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {entrevistas.map(e => (
                                <div key={e.id} className="card" style={{ padding: 'var(--spacing-lg)' }}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--gray-100)', marginBottom: 4 }}>
                                                {e.tipo} · {new Date(e.fecha_hora).toLocaleString('es-MX')}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                                                {e.entrevistador && `👤 ${e.entrevistador}`}
                                                {e.lugar_liga && ` · 📍 ${e.lugar_liga}`}
                                                {e.duracion_min && ` · ⏱ ${e.duracion_min} min`}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {e.calificacion != null && <span style={{ fontWeight: 700, color: 'var(--primary-400)', fontSize: '1.1rem' }}>{e.calificacion}/10</span>}
                                            <span className={`chip chip-${e.estatus === 'realizada' ? 'APROBADO' : e.estatus === 'cancelada' ? 'CANCELADO' : 'REVISION'}`}>{e.estatus}</span>
                                        </div>
                                    </div>
                                    {e.comentarios && <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--gray-400)' }}>{e.comentarios}</p>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state"><div className="empty-icon">🎙️</div><p>Sin entrevistas registradas</p></div>
                    )}
                </div>
            )}

            {/* TAB: PRUEBAS */}
            {tab === 'pruebas' && (
                <div>
                    <div className="flex justify-between items-center mb-lg">
                        <span style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>Evaluaciones aplicadas</span>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowPruebaForm(true)}>📝 Agregar Prueba</button>
                    </div>
                    {pruebas.length ? (
                        <div className="table-container">
                            <table className="table aspirantes-table">
                                <thead><tr>
                                    <th>Tipo</th><th>Fecha</th><th>Calificación</th><th>Resultado</th><th>Aplicó</th>
                                </tr></thead>
                                <tbody>
                                    {pruebas.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.tipo_prueba}</td>
                                            <td>{new Date(p.fecha_aplicacion).toLocaleDateString('es-MX')}</td>
                                            <td>{p.calificacion != null ? `${p.calificacion}` : '—'}</td>
                                            <td>{p.resultado ? <StatusChip estatus={p.resultado} /> : '—'}</td>
                                            <td>{p.aplicada_por ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state"><div className="empty-icon">📝</div><p>Sin pruebas aplicadas</p></div>
                    )}
                </div>
            )}

            {/* TAB: DOCUMENTOS */}
            {tab === 'documentos' && (
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-400)', marginBottom: 'var(--spacing-lg)' }}>
                        Sube y valida los documentos del candidato
                    </p>
                    <div className="grid grid-2">
                        {(cats['doc_aspirante'] ?? [
                            { clave: 'CV',         valor: 'CV',                       descripcion: 'Currículum Vitae' },
                            { clave: 'ID',         valor: 'Identificación',           descripcion: 'INE / Pasaporte' },
                            { clave: 'DOMICILIO',  valor: 'Comprobante de domicilio', descripcion: 'Recibo de luz, agua, etc.' },
                            { clave: 'CONSTANCIAS',valor: 'Constancias',              descripcion: 'De estudios o laborales' },
                            { clave: 'REFERENCIAS',valor: 'Referencias',              descripcion: 'Cartas de recomendación' },
                        ]).map((doc: any) => {
                            const est = docEstatus[doc.clave];
                            return (
                                <div key={doc.clave} className="doc-card">
                                    <div className="doc-card-header">
                                        <div className="doc-status-icon">
                                            {est === 'validado' ? '✅' : est === 'rechazado' ? '❌' : est === 'recibido' ? '📄' : '⏳'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-100)' }}>{doc.valor}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{doc.descripcion}</div>
                                        </div>
                                        <span className={`doc-status-badge ${est ?? 'pendiente'}`}>{est ?? 'Pendiente'}</span>
                                    </div>

                                    {/* Subir / reemplazar archivo */}
                                    <FileUpload
                                        label={doc.valor}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        existingUrl={documentos.find((d: any) => d.tipo_documento === doc.clave)?.archivo_url}
                                        existingName={documentos.find((d: any) => d.tipo_documento === doc.clave)?.nombre_archivo}
                                        onUploaded={async (url, nombre) => {
                                            await apiFetch('/documentos', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    aspirante_id: asp.id,
                                                    tipo_documento: doc.clave,
                                                    nombre_archivo: nombre,
                                                    archivo_url: url,
                                                }),
                                            });
                                            load();
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal: Entrevista */}
            {showEntForm && (
                <Modal title="🎙️ Programar Entrevista" onClose={() => setShowEntForm(false)}>
                    <form className="form" onSubmit={crearEntrevista}>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Tipo *</label>
                                <select className="input" value={entForm.tipo} onChange={e => setEntForm({ ...entForm, tipo: e.target.value })}>
                                    {(cats['tipo_entrevista'] ?? [{ clave: 'PRESENCIAL', valor: 'Presencial' }, { clave: 'VIRTUAL', valor: 'Virtual' }, { clave: 'TELEFONICA', valor: 'Telefónica' }]).map((c: any) => (
                                        <option key={c.clave} value={c.clave}>{c.valor}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Duración (min)</label>
                                <input type="number" className="input" value={entForm.duracion_min} onChange={e => setEntForm({ ...entForm, duracion_min: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Fecha y hora *</label>
                            <input
                                type="datetime-local"
                                className="input"
                                required
                                value={entForm.fecha_hora ?? ''}
                                onChange={e => setEntForm({ ...entForm, fecha_hora: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Entrevistador</label>
                            <input className="input" value={entForm.entrevistador || ''} onChange={e => setEntForm({ ...entForm, entrevistador: e.target.value })} placeholder="Nombre del entrevistador" />
                        </div>
                        <div className="form-group">
                            <label className="label">Lugar / Liga de videollamada</label>
                            <input className="input" value={entForm.lugar_liga || ''} onChange={e => setEntForm({ ...entForm, lugar_liga: e.target.value })} placeholder="Sala A / https://meet.google.com/…" />
                        </div>
                        <div className="flex gap-md">
                            <button type="submit" className="btn btn-purple" style={{ flex: 1 }}>💾 Programar</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowEntForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal: Prueba */}
            {showPruebaForm && (
                <Modal title="📝 Registrar Prueba" onClose={() => setShowPruebaForm(false)}>
                    <form className="form" onSubmit={crearPrueba}>
                        <div className="form-group">
                            <label className="label">Tipo de prueba *</label>
                            <select className="input" value={prForm.tipo_prueba} onChange={e => setPrForm({ ...prForm, tipo_prueba: e.target.value })}>
                                {(cats['tipo_prueba'] ?? []).map((c: any) => (
                                    <option key={c.clave} value={c.clave}>{c.valor}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Fecha de aplicación *</label>
                                <input type="date" className="input" required value={prForm.fecha_aplicacion} onChange={e => setPrForm({ ...prForm, fecha_aplicacion: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Calificación</label>
                                <input type="number" min={0} max={100} step={0.1} className="input" value={prForm.calificacion || ''} onChange={e => setPrForm({ ...prForm, calificacion: e.target.value })} placeholder="0–100" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Resultado</label>
                            <select className="input" value={prForm.resultado || ''} onChange={e => setPrForm({ ...prForm, resultado: e.target.value })}>
                                <option value="">— Sin resultado aún —</option>
                                {(cats['resultado_prueba'] ?? []).map((c: any) => (
                                    <option key={c.clave} value={c.clave}>{c.valor}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Observaciones</label>
                            <textarea className="input" rows={2} value={prForm.observaciones || ''} onChange={e => setPrForm({ ...prForm, observaciones: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Aplicó</label>
                            <input className="input" value={prForm.aplicada_por || ''} onChange={e => setPrForm({ ...prForm, aplicada_por: e.target.value })} placeholder="Nombre de quien aplicó la prueba" />
                        </div>
                        <div className="flex gap-md">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>💾 Guardar</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowPruebaForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal: Rechazar */}
            {showRechazarForm && (
                <Modal title="❌ Rechazar Candidato" onClose={() => setShowRechazarForm(false)}>
                    <div className="form">
                        <div className="form-group">
                            <label className="label">Motivo de rechazo *</label>
                            <select className="input" value={rechMotivo} onChange={e => setRechMotivo(e.target.value)}>
                                <option value="">Selecciona un motivo…</option>
                                {(cats['motivo_rechazo'] ?? []).map((c: any) => (
                                    <option key={c.clave} value={c.clave}>{c.valor}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-md">
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={rechazar} disabled={!rechMotivo}>Confirmar Rechazo</button>
                            <button className="btn btn-secondary" onClick={() => setShowRechazarForm(false)}>Cancelar</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL EXPORTADO
// ────────────────────────────────────────────────────────────
type ReclutamientoTab = 'pipeline' | 'vacantes' | 'aspirantes' | 'catalogos';

interface ReclutamientoModuleProps {
    initialTab?: ReclutamientoTab;
    onContratarAspirante?: (empleado: any) => void;
}

const ReclutamientoModule: React.FC<ReclutamientoModuleProps> = ({ initialTab = 'pipeline', onContratarAspirante }) => {
    const [tab, setTab]             = useState<ReclutamientoTab>(initialTab);
    const [selectedAspirante, setSelectedAspirante] = useState<any>(null);
    const [selectedVacante, setSelectedVacante]     = useState<any>(null);
    const [cats, setCats]           = useState<Record<string, any[]>>({});
    const [pipelineKey, setPipelineKey] = useState(0);

    // Cuando el sidebar cambia de sub-sección, actualizar el tab activo
    useEffect(() => {
        setTab(initialTab);
        setSelectedAspirante(null); // limpiar detalle al cambiar de sección
    }, [initialTab]);

    useEffect(() => {
        apiFetch('/catalogos').then(r => { if (r.success) setCats(r.data); });
    }, []);

    // Si hay un aspirante seleccionado mostramos el detalle
    if (selectedAspirante) {
        return (
            <AspiranteDetail
                aspirante={selectedAspirante}
                onBack={() => setSelectedAspirante(null)}
                cats={cats}
                onRefresh={() => setPipelineKey(k => k + 1)}
                onContratarAspirante={onContratarAspirante}
            />
        );
    }

    return (
        <div>
            {/* Tabs principales */}
            <div className="rec-tabs">
                {([
                    { key: 'pipeline',    label: '🎯 Pipeline' },
                    { key: 'vacantes',    label: '📋 Vacantes' },
                    { key: 'aspirantes',  label: '👥 Todos los Aspirantes' },
                    { key: 'catalogos',   label: '📚 Catálogos' },
                ] as const).map(t => (
                    <button key={t.key} className={`rec-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'pipeline' && (
                <PipelineView
                    key={pipelineKey}
                    vacanteId={selectedVacante?.id}
                    onSelectAspirante={setSelectedAspirante}
                />
            )}

            {tab === 'vacantes' && (
                <VacantesView
                    onSelectVacante={(v) => {
                        setSelectedVacante(v);
                        setTab('pipeline');
                    }}
                />
            )}

            {tab === 'aspirantes' && <AspirantesListView onSelectAspirante={setSelectedAspirante} cats={cats} />}

            {tab === 'catalogos' && <CatalogosView />}
        </div>
    );
};

// ── Lista completa de aspirantes ──────────────────────────────
const AspirantesListView: React.FC<{ onSelectAspirante: (a: any) => void; cats: Record<string, any[]> }> = ({ onSelectAspirante, cats }) => {
    const [aspirantes, setAspirantes] = useState<any[]>([]);
    const [stats, setStats]           = useState<any>({});
    const [filtroEstatus, setFiltroEstatus] = useState('');
    const [filtroEtapa, setFiltroEtapa]     = useState('');
    const [loading, setLoading]       = useState(true);

    const load = useCallback(async () => {
        let path = '/aspirantes?';
        if (filtroEstatus) path += `estatus=${filtroEstatus}&`;
        if (filtroEtapa)   path += `etapa=${filtroEtapa}&`;
        const [a, s] = await Promise.all([apiFetch(path), apiFetch('/aspirantes/estadisticas')]);
        if (a.success) setAspirantes(a.data);
        if (s.success) setStats(s.data);
        setLoading(false);
    }, [filtroEstatus, filtroEtapa]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><p>Cargando aspirantes…</p></div>;

    return (
        <div>
            {/* Stats row */}
            <div className="rec-stats-row">
                {[
                    { label: 'Registrados',   val: stats.registrados  ?? 0 },
                    { label: 'En revisión',   val: stats.en_revision  ?? 0 },
                    { label: 'Entrevista',    val: stats.en_entrevista ?? 0 },
                    { label: 'Evaluados',     val: stats.evaluados    ?? 0 },
                    { label: 'Aprobados',     val: stats.aprobados    ?? 0 },
                    { label: 'Rechazados',    val: stats.rechazados   ?? 0 },
                ].map(s => (
                    <div key={s.label} className="rec-stat-card">
                        <div className="rec-stat-value">{s.val}</div>
                        <div className="rec-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
                <select className="input" style={{ maxWidth: 200 }} value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}>
                    <option value="">Todos los estatus</option>
                    {(cats['estatus_aspirante'] ?? []).map((c: any) => (
                        <option key={c.clave} value={c.clave}>{c.valor}</option>
                    ))}
                </select>
                <select className="input" style={{ maxWidth: 200 }} value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}>
                    <option value="">Todas las etapas</option>
                    {(cats['etapa_proceso'] ?? []).map((c: any) => (
                        <option key={c.clave} value={c.clave}>{c.valor}</option>
                    ))}
                </select>
                <button className="btn btn-ghost btn-sm" onClick={() => { setFiltroEstatus(''); setFiltroEtapa(''); }}>🔄 Limpiar</button>
            </div>

            {aspirantes.length ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        <table className="table aspirantes-table">
                            <thead><tr>
                                <th>Nombre</th><th>Email</th><th>Vacante</th>
                                <th>Etapa</th><th>Estatus</th><th>Fuente</th><th>Registro</th><th></th>
                            </tr></thead>
                            <tbody>
                                {aspirantes.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--gray-100)' }}>{a.nombre} {a.apellido_paterno}</td>
                                        <td>{a.email}</td>
                                        <td>{a.vacante_titulo ?? '—'}</td>
                                        <td><span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{a.etapa_actual}</span></td>
                                        <td><StatusChip estatus={a.estatus} /></td>
                                        <td><span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{a.fuente_reclutamiento ?? '—'}</span></td>
                                        <td><span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{new Date(a.created_at).toLocaleDateString('es-MX')}</span></td>
                                        <td>
                                            <button className="btn btn-ghost btn-sm" onClick={() => onSelectAspirante(a)}>Ver →</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>Sin aspirantes</h3>
                    <p>Agrega candidatos desde el Pipeline o las Vacantes</p>
                </div>
            )}
        </div>
    );
};

export default ReclutamientoModule;
