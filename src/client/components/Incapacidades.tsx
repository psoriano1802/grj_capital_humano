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

const IncapacidadesModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'registrar-incapacidad' }) => {
    const [tab, setTab] = useState(initialTab);
    const [incapacidades, setIncapacidades] = useState<any[]>([]);
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useSession();
    
    // Formulario Incapacidad
    const [form, setForm] = useState({
        empleado_id: 0,
        tipo_incapacidad: '',
        fecha_inicio: '',
        fecha_fin: '',
        dias_totales: '',
        folio_incapacidad: '',
        institucion: '',
        diagnostico: ''
    });

    useEffect(() => { setTab(initialTab); }, [initialTab]);

    useEffect(() => {
        const loadEmpleadoOptions = async () => {
            const res = await fetchApi('/api/empleados');
            const empleadosData = res.success && Array.isArray(res.data) ? res.data : [];
            setEmpleados(empleadosData);

            if (empleadosData.length > 0) {
                const defaultId = currentUser && empleadosData.some((e: any) => e.id === currentUser.id)
                    ? currentUser.id
                    : empleadosData[0].id;
                setForm((prev) => ({ ...prev, empleado_id: defaultId }));
            }
        };

        loadEmpleadoOptions();

        if (tab === 'mis-incapacidades' || tab === 'incapacidades-activas') {
            loadIncapacidades();
        }
    }, [tab, currentUser]);

    const loadIncapacidades = async () => {
        setLoading(true);
        const url = tab === 'mis-incapacidades'
            ? currentUser ? `/api/incapacidades/empleado/${currentUser.id}` : null
            : '/api/incapacidades/activas';
        if (!url) { setIncapacidades([]); setLoading(false); return; }
        const res = await fetchApi(url);
        setIncapacidades(res.success && Array.isArray(res.data) ? res.data : []);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.empleado_id) {
            alert('❌ No hay empleados disponibles para registrar la incapacidad. Primero crea un empleado.');
            return;
        }

        const res = await fetchApi('/api/incapacidades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                dias_totales: parseInt(form.dias_totales) || 0,
                empleado_id: Number(form.empleado_id)
            })
        });

        if (res.success) {
            alert('✅ Incapacidad registrada exitosamente.');
            setForm((prev) => ({
                ...prev,
                tipo_incapacidad: '',
                fecha_inicio: '',
                fecha_fin: '',
                dias_totales: '',
                folio_incapacidad: '',
                institucion: '',
                diagnostico: ''
            }));
            setTab('mis-incapacidades');
        } else {
            alert(`❌ Error al registrar incapacidad: ${res.error || 'Error desconocido'}`);
        }
    };

    return (
        <div className="fade-in">
            <div className="org-tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                <button className={`org-tab ${tab === 'registrar-incapacidad' ? 'active' : ''}`} onClick={() => setTab('registrar-incapacidad')}>🏥 Registrar</button>
                <button className={`org-tab ${tab === 'mis-incapacidades' ? 'active' : ''}`} onClick={() => setTab('mis-incapacidades')}>📋 Mis Incapacidades</button>
                <button className={`org-tab ${tab === 'incapacidades-activas' ? 'active' : ''}`} onClick={() => setTab('incapacidades-activas')}>🔴 Incapacidades Activas (RH)</button>
            </div>

            {tab === 'registrar-incapacidad' && (
                <div>
                    <div className="section-header">
                        <h1>🏥 Registrar Incapacidad</h1>
                        <p>Añade los detalles de tu baja médica institucional</p>
                    </div>
                    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <form className="form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="label">Empleado *</label>
                                <select className="input" required value={form.empleado_id || ''} onChange={e => setForm({...form, empleado_id: Number(e.target.value)})}>
                                    <option value="">Seleccionar empleado...</option>
                                    {empleados.map((empleado) => (
                                        <option key={empleado.id} value={empleado.id}>
                                            {empleado.nombre} {empleado.apellido_paterno} ({empleado.numero_empleado})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Tipo de Incapacidad *</label>
                                <select className="input" required value={form.tipo_incapacidad} onChange={e => setForm({...form, tipo_incapacidad: e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    <option value="ENFERMEDAD">Enfermedad General</option>
                                    <option value="RIESGO">Riesgo de Trabajo</option>
                                    <option value="MATERNIDAD">Maternidad</option>
                                    <option value="PATERNIDAD">Paternidad</option>
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
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Folio de Incapacidad *</label>
                                    <input type="text" required className="input" placeholder="Ej: IMSS-12345678" value={form.folio_incapacidad} onChange={e => setForm({...form, folio_incapacidad: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Institución *</label>
                                    <select className="input" required value={form.institucion} onChange={e => setForm({...form, institucion: e.target.value})}>
                                        <option value="">Seleccionar...</option>
                                        <option value="IMSS">IMSS</option>
                                        <option value="ISSSTE">ISSSTE</option>
                                        <option value="PARTICULAR">Médico Particular</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Días Totales *</label>
                                <input type="number" required min={1} className="input" placeholder="Ej: 3" value={form.dias_totales} onChange={e => setForm({...form, dias_totales: e.target.value})} style={{ maxWidth: '180px' }} />
                            </div>
                            <div className="form-group">
                                <label className="label">Diagnóstico Inicial (Opcional)</label>
                                <textarea className="input" rows={3} placeholder="Descripción del diagnóstico..." value={form.diagnostico} onChange={e => setForm({...form, diagnostico: e.target.value})}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                                <span>💾</span> Registrar Incapacidad
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {(tab === 'mis-incapacidades' || tab === 'incapacidades-activas') && (
                <div>
                    <div className="section-header">
                        <h1>{tab === 'mis-incapacidades' ? '📋 Mis Incapacidades' : '🔴 Incapacidades Activas'}</h1>
                        <p>{loading ? '⏳ Cargando incapacidades...' : `${incapacidades.length} registros encontrados`}</p>
                    </div>

                    {incapacidades.length === 0 && !loading && (
                        <div className="card empty-state">
                            <div className="empty-icon">🏥</div>
                            <h3>Sin registros de incapacidad.</h3>
                        </div>
                    )}

                    {incapacidades.length > 0 && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tipo / Folio</th>
                                        <th>Institución</th>
                                        <th>Fechas</th>
                                        <th>Días</th>
                                        <th>Estatus</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incapacidades.map((i: any) => (
                                        <tr key={i.id}>
                                            <td>
                                                <strong>{i.tipo_incapacidad}</strong><br/>
                                                <span style={{fontSize: '0.85rem', color: 'var(--gray-400)'}}>
                                                    Folio: {i.folio_incapacidad}
                                                </span>
                                            </td>
                                            <td><span className="org-badge org-badge-blue">{i.institucion}</span></td>
                                            <td>{new Date(i.fecha_inicio).toLocaleDateString()} a {new Date(i.fecha_fin).toLocaleDateString()}</td>
                                            <td>{i.dias_totales}</td>
                                            <td>
                                                <span className={`org-badge ${i.estatus === 'activa' ? 'org-badge-orange' : i.estatus === 'finalizada' ? 'org-badge-green' : 'org-badge-gray'}`}>
                                                    {i.estatus}
                                                </span>
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

export default IncapacidadesModule;
