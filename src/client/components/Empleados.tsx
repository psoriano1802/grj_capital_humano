import React, { useState, useEffect, useCallback } from 'react';
import './Empleados.css';
import BiometricAuth from './BiometricAuth';

// ── Tipos ───────────────────────────────────────────────────
interface Empleado {
    id?: number;
    numero_empleado: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    email: string;
    telefono: string;
    fecha_nacimiento: string;
    fecha_ingreso: string;
    puesto: string;
    departamento: string;
    salario: number;
    tipo_contratacion?: string;
    tipo_empleado?: string;
    tipo_jornada?: string;
    turno?: string;
    horario_laboral?: string;
    esquema_pago?: string;
    tipo_contrato?: string;
    estatus?: string;
}

// ── API Helper ──────────────────────────────────────────────
const fetchApi = async (url: string, options?: RequestInit) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("API Error", e);
        return { success: false, data: null };
    }
};

const EmpleadosModule: React.FC<{ prefillDraft?: any; onDraftUsed?: () => void }> = ({ prefillDraft, onDraftUsed }) => {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [puestos, setPuestos] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [catalogosContratacion, setCatalogosContratacion] = useState<any>({});

    const [form, setForm] = useState<Empleado>({
        numero_empleado: '', nombre: '', apellido_paterno: '', apellido_materno: '',
        email: '', telefono: '', fecha_nacimiento: '', fecha_ingreso: '',
        puesto: '', departamento: '', salario: 0,
        tipo_contratacion: '', tipo_empleado: '', tipo_jornada: '',
        turno: '', horario_laboral: '', esquema_pago: '', tipo_contrato: ''
    });

    const [datosBiometricos, setDatosBiometricos] = useState<string | null>(null);
    const [showBiometricCapture, setShowBiometricCapture] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [empRes, ptoRes, depRes, catRes] = await Promise.all([
            fetchApi('/api/empleados'),
            fetchApi('/api/organizacion/puestos'),
            fetchApi('/api/organizacion/departamentos'),
            fetchApi('/api/contratacion/todos-catalogos')
        ]);
        if (empRes.success) setEmpleados(empRes.data);
        if (ptoRes.success) setPuestos(ptoRes.data);
        if (depRes.success) setDepartamentos(depRes.data);
        if (catRes.success) setCatalogosContratacion(catRes.data);
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Si llega un empleado desde el modulo de Reclutamiento (aspirante contratado),
    // abrir su edicion para completar los datos faltantes.
    useEffect(() => {
        if (!prefillDraft) return;
        const emp = prefillDraft;
        setEditingEmp(emp);
        setForm({
            ...emp,
            fecha_nacimiento: emp.fecha_nacimiento ? new Date(emp.fecha_nacimiento).toISOString().split('T')[0] : '',
            fecha_ingreso: emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
        onDraftUsed?.();
    }, [prefillDraft, onDraftUsed]);

    const openNew = () => {
        setEditingEmp(null);
        setForm({
            numero_empleado: `EMP-${Math.floor(Math.random() * 10000)}`,
            nombre: '', apellido_paterno: '', apellido_materno: '',
            email: '', telefono: '', fecha_nacimiento: '', fecha_ingreso: new Date().toISOString().split('T')[0],
            puesto: '', departamento: '', salario: 0,
            tipo_contratacion: '', tipo_empleado: '', tipo_jornada: '',
            turno: '', horario_laboral: '', esquema_pago: '', tipo_contrato: ''
        });
        setDatosBiometricos(null);
        setShowBiometricCapture(false);
        setShowModal(true);
    };

    const openEdit = (emp: Empleado) => {
        setEditingEmp(emp);
        setForm({
            ...emp,
            fecha_nacimiento: emp.fecha_nacimiento ? new Date(emp.fecha_nacimiento).toISOString().split('T')[0] : '',
            fecha_ingreso: emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toISOString().split('T')[0] : ''
        });
        setDatosBiometricos(null);
        setShowBiometricCapture(false);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingEmp ? `/api/empleados/${editingEmp.id}` : '/api/empleados';
        const method = editingEmp ? 'PUT' : 'POST';

        const payload: any = { ...form };
        if (!editingEmp && datosBiometricos) {
            payload.datos_biometricos = datosBiometricos;
            payload.tipo_biometrico = 'faceid';
        }

        const res = await fetchApi(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.success) {
            setShowModal(false);
            setDatosBiometricos(null);
            setShowBiometricCapture(false);
            loadData();
        } else {
            alert('Error guardando empleado: ' + (res.error || 'Desconocido'));
        }
    };

    const deactivate = async (id: number) => {
        if (!confirm('¿Deseas dar de baja a este empleado?')) return;
        const res = await fetchApi(`/api/empleados/${id}`, { method: 'DELETE' });
        if (res.success) loadData();
    };

    const filtered = empleados.filter(e => 
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.apellido_paterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.numero_empleado.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="emp-container">
            <div className="emp-header">
                <div className="emp-title">
                    <h1>👔 Directorio de Empleados</h1>
                    <p>Gestión del personal de la organización ({empleados.length} activos)</p>
                </div>
                <div className="emp-actions">
                    <input 
                        className="input emp-search" 
                        placeholder="🔍 Buscar por nombre o número..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                    <button className="btn btn-primary" onClick={openNew}>
                        ➕ Nuevo Empleado
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="emp-loading">⏳ Cargando directorio de empleados...</div>
            ) : filtered.length === 0 ? (
                <div className="emp-empty">
                    <div className="emp-empty-icon">👥</div>
                    <h3>No se encontraron empleados</h3>
                    <p>Intenta con otra búsqueda o agrega un nuevo colaborador.</p>
                </div>
            ) : (
                <div className="emp-grid">
                    {filtered.map(emp => (
                        <div key={emp.id} className="emp-card">
                            <div className="emp-card-header">
                                <div className="emp-avatar">
                                    {emp.nombre.charAt(0)}{emp.apellido_paterno.charAt(0)}
                                    <div className={`emp-status-dot ${emp.estatus === 'activo' ? 'activo' : 'inactivo'}`} title={`Estatus: ${emp.estatus}`}></div>
                                </div>
                                <div className="emp-info">
                                    <div className="emp-name">{emp.nombre} {emp.apellido_paterno}</div>
                                    <div className="emp-id">{emp.numero_empleado}</div>
                                    <div className="emp-role">{emp.puesto || 'Sin Puesto'}</div>
                                    <div className="emp-dept">{emp.departamento || 'Sin Departamento'}</div>
                                </div>
                            </div>
                            
                            <div className="emp-details">
                                <div className="emp-detail-item">
                                    <span className="emp-detail-icon">📧</span>
                                    <span>{emp.email}</span>
                                </div>
                                <div className="emp-detail-item">
                                    <span className="emp-detail-icon">📞</span>
                                    <span>{emp.telefono || 'Sin registro'}</span>
                                </div>
                            </div>

                            <div className="emp-card-actions">
                                <button className="btn btn-secondary" style={{flex: 1}} onClick={() => openEdit(emp)}>✏️ Editar</button>
                                <button className="btn btn-secondary" style={{color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)'}} onClick={() => deactivate(emp.id!)}>⛔</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Creación / Edición */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <div className="modal-title">{editingEmp ? '✏️ Editar Empleado' : '➕ Nuevo Empleado'}</div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form className="form" onSubmit={handleSubmit}>
                            <h4 style={{ color: 'var(--primary-400)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>
                                Datos Personales
                            </h4>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Nombre *</label>
                                    <input className="input" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej. Juan" />
                                </div>
                                <div className="grid grid-2" style={{ gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="label">Apellido Pat. *</label>
                                        <input className="input" required value={form.apellido_paterno} onChange={e => setForm({...form, apellido_paterno: e.target.value})} placeholder="Pérez" />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Apellido Mat.</label>
                                        <input className="input" value={form.apellido_materno} onChange={e => setForm({...form, apellido_materno: e.target.value})} placeholder="López" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Correo Electrónico *</label>
                                    <input type="email" className="input" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="juan.perez@empresa.com" />
                                </div>
                                <div className="form-group">
                                    <label className="label">Teléfono</label>
                                    <input type="tel" className="input" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="55 1234 5678" />
                                </div>
                            </div>

                            <div className="form-group" style={{ maxWidth: '50%' }}>
                                <label className="label">Fecha de Nacimiento</label>
                                <input type="date" className="input" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} />
                            </div>

                            <h4 style={{ color: 'var(--primary-400)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', marginTop: '1rem' }}>
                                Datos Corporativos
                            </h4>
                            
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Número de Empleado *</label>
                                    <input className="input" required value={form.numero_empleado} onChange={e => setForm({...form, numero_empleado: e.target.value})} placeholder="EMP-001" />
                                </div>
                                <div className="form-group">
                                    <label className="label">Fecha de Ingreso *</label>
                                    <input type="date" className="input" required value={form.fecha_ingreso} onChange={e => setForm({...form, fecha_ingreso: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Departamento *</label>
                                    <select className="input" required value={form.departamento} onChange={e => setForm({...form, departamento: e.target.value})}>
                                        <option value="">— Seleccionar —</option>
                                        {departamentos.map(d => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Puesto *</label>
                                    <select className="input" required value={form.puesto} onChange={e => setForm({...form, puesto: e.target.value})}>
                                        <option value="">— Seleccionar —</option>
                                        {puestos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <h4 style={{ color: 'var(--primary-400)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', marginTop: '1rem' }}>
                                Datos de Contratación
                            </h4>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Tipo de Contrato</label>
                                    <select className="input" value={form.tipo_contrato} onChange={e => setForm({...form, tipo_contrato: e.target.value})}>
                                        <option value="">— Seleccionar —</option>
                                        {catalogosContratacion.tipos_contrato?.map((c: any) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Tipo de Contratación</label>
                                    <select className="input" value={form.tipo_contratacion} onChange={e => setForm({...form, tipo_contratacion: e.target.value})}>
                                        <option value="">— Seleccionar —</option>
                                        {catalogosContratacion.tipos_contratacion?.map((c: any) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Tipo de Empleado</label>
                                    <select className="input" value={form.tipo_empleado} onChange={e => setForm({...form, tipo_empleado: e.target.value})}>
                                        <option value="">— Seleccionar —</option>
                                        {catalogosContratacion.tipos_empleado?.map((c: any) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Esquema de Pago</label>
                                    <select className="input" value={form.esquema_pago} onChange={e => setForm({...form, esquema_pago: e.target.value})}>
                                        <option value="">— Seleccionar —</option>
                                        {catalogosContratacion.esquemas_pago?.map((c: any) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Jornada y Turno</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select className="input" style={{flex: 1}} value={form.tipo_jornada} onChange={e => setForm({...form, tipo_jornada: e.target.value})}>
                                            <option value="">— Jornada —</option>
                                            {catalogosContratacion.tipos_jornada?.map((c: any) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                        </select>
                                        <select className="input" style={{flex: 1}} value={form.turno} onChange={e => setForm({...form, turno: e.target.value})}>
                                            <option value="">— Turno —</option>
                                            {catalogosContratacion.turnos?.map((c: any) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Horario Laboral</label>
                                    <select className="input" value={form.horario_laboral} onChange={e => setForm({...form, horario_laboral: e.target.value})}>
                                        <option value="">— Seleccionar —</option>
                                        {catalogosContratacion.horarios_laborales?.map((c: any) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ maxWidth: '50%' }}>
                                <label className="label">Salario Base ($)</label>
                                <input type="number" step="0.01" className="input" required value={form.salario} onChange={e => setForm({...form, salario: parseFloat(e.target.value) || 0})} placeholder="15000.00" />
                            </div>

                            {!editingEmp && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                                    <h4 style={{ color: 'var(--primary-400)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>
                                        Datos Biométricos
                                    </h4>
                                    {!showBiometricCapture ? (
                                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                                            {datosBiometricos ? (
                                                <div style={{ color: '#22c55e', marginBottom: '0.5rem' }}>✅ Rostro capturado correctamente</div>
                                            ) : (
                                                <p style={{ color: 'var(--gray-400)', marginBottom: '0.5rem' }}>Sin biometricos capturados</p>
                                            )}
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowBiometricCapture(true)}
                                            >
                                                📷 {datosBiometricos ? 'Volver a Capturar' : 'Capturar Rostro'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                                            <BiometricAuth
                                                modo="enrolar"
                                                empleadoPredefino={form.numero_empleado || form.nombre || 'nuevo'}
                                                onCapture={async (datos) => {
                                                    setDatosBiometricos(datos);
                                                    setShowBiometricCapture(false);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                style={{ marginTop: '0.5rem', width: '100%' }}
                                                onClick={() => setShowBiometricCapture(false)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>💾 {editingEmp ? 'Guardar Cambios' : 'Registrar Empleado'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmpleadosModule;
