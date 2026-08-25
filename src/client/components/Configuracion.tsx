import React, { useState, useEffect } from 'react';

const fetchApi = async (url: string, options?: RequestInit) => {
    try {
        const res = await fetch(url, options);
        const data = await res.json();
        return data;
    } catch {
        return { success: false, data: [], error: 'Error de conexión' };
    }
};

type TabType = 'perfiles' | 'accesos' | 'usuarios';

const ESTATUS_USUARIO: Record<string, string> = {
    activo: 'Activo',
    inactivo: 'Inactivo',
    temporalmente_inactivo: 'Temporalmente Inactivo',
};

const ConfiguracionModule: React.FC<{ initialTab?: TabType }> = ({ initialTab = 'perfiles' }) => {
    const [tab, setTab] = useState<TabType>(initialTab);

    // ── Perfiles ──────────────────────────────────────────────
    const [perfiles, setPerfiles] = useState<any[]>([]);
    const [loadingP, setLoadingP] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [pForm, setPForm] = useState({
        clave: '',
        nombre: '',
        descripcion: '',
        nivel_jerarquico: 0,
        es_administrador: false,
        estatus: 'activo',
    });

    // ── Accesos ───────────────────────────────────────────────
    const [accesos, setAccesos] = useState<any[]>([]);
    const [perfilSel, setPerfilSel] = useState<number | null>(null);
    const [asignados, setAsignados] = useState<Set<number>>(new Set());
    const [dirty, setDirty] = useState(false);
    const [aForm, setAForm] = useState({ clave: '', nombre: '', modulo: '', icono: '📌', descripcion: '' });

    // ── Usuarios ──────────────────────────────────────────────
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [usuarioEdit, setUsuarioEdit] = useState<Record<number, { perfil_id: number | ''; estatus_usuario: string }>>({});

    const loadPerfiles = async () => {
        setLoadingP(true);
        const res = await fetchApi('/api/perfiles');
        setPerfiles(res.success && Array.isArray(res.data) ? res.data : []);
        setLoadingP(false);
    };

    const loadAccesos = async () => {
        const res = await fetchApi('/api/accesos');
        setAccesos(res.success && Array.isArray(res.data) ? res.data : []);
    };

    const loadAsignados = async (perfilId: number) => {
        const res = await fetchApi(`/api/perfiles/${perfilId}/accesos`);
        if (res.success && Array.isArray(res.data)) {
            const set = new Set<number>();
            res.data.forEach((a: any) => {
                if (a.asignacion_id != null) set.add(a.id);
            });
            setAsignados(set);
        }
        setDirty(false);
    };

    const loadUsuarios = async () => {
        const res = await fetchApi('/api/seguridad/usuarios');
        setUsuarios(res.success && Array.isArray(res.data) ? res.data : []);
    };

    useEffect(() => { setTab(initialTab); }, [initialTab]);
    useEffect(() => { loadPerfiles(); }, []);
    useEffect(() => { loadAccesos(); }, []);
    useEffect(() => { loadUsuarios(); }, []);

    // Cargar asignaciones cuando cambia el perfil seleccionado
    useEffect(() => {
        if (tab === 'accesos' && perfilSel != null) {
            loadAsignados(perfilSel);
        }
    }, [tab, perfilSel]);

    // Al entrar a "Accesos", seleccionar el primer perfil si no hay ninguno
    useEffect(() => {
        if (tab === 'accesos' && perfilSel == null && perfiles.length > 0) {
            setPerfilSel(perfiles[0].id);
        }
    }, [tab, perfilSel, perfiles]);

    const abrirNuevo = () => {
        setEditId(null);
        setPForm({ clave: '', nombre: '', descripcion: '', nivel_jerarquico: 0, es_administrador: false, estatus: 'activo' });
        setShowForm(true);
    };

    const abrirEdicion = (p: any) => {
        setEditId(p.id);
        setPForm({
            clave: p.clave,
            nombre: p.nombre,
            descripcion: p.descripcion || '',
            nivel_jerarquico: p.nivel_jerarquico,
            es_administrador: !!p.es_administrador,
            estatus: p.estatus,
        });
        setShowForm(true);
    };

    const guardarPerfil = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...pForm, nivel_jerarquico: Number(pForm.nivel_jerarquico) || 0 };
        const url = editId ? `/api/perfiles/${editId}` : '/api/perfiles';
        const method = editId ? 'PUT' : 'POST';
        const res = await fetchApi(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.success) {
            alert(`✅ Perfil ${editId ? 'actualizado' : 'creado'}.`);
            setShowForm(false);
            loadPerfiles();
        } else {
            alert(`❌ ${res.error || 'Error al guardar perfil.'}`);
        }
    };

    const eliminarPerfil = async (p: any) => {
        if (!confirm(`¿Eliminar el perfil "${p.nombre}"?`)) return;
        const res = await fetchApi(`/api/perfiles/${p.id}`, { method: 'DELETE' });
        if (res.success) {
            alert('✅ Perfil eliminado.');
            if (perfilSel === p.id) setPerfilSel(null);
            loadPerfiles();
        } else {
            alert(`❌ ${res.error || 'No se pudo eliminar el perfil.'}`);
        }
    };

    const toggleAcceso = (accesoId: number) => {
        setAsignados((prev) => {
            const next = new Set(prev);
            if (next.has(accesoId)) next.delete(accesoId);
            else next.add(accesoId);
            return next;
        });
        setDirty(true);
    };

    const guardarAccesos = async () => {
        if (perfilSel == null) return;
        const res = await fetchApi(`/api/perfiles/${perfilSel}/accesos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acceso_ids: [...asignados] }),
        });
        if (res.success) {
            alert('✅ Accesos del perfil actualizados.');
            setDirty(false);
            loadPerfiles();
        } else {
            alert(`❌ ${res.error || 'No se pudieron guardar los accesos.'}`);
        }
    };

    const crearAcceso = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aForm.clave.trim() || !aForm.nombre.trim()) {
            alert('❌ Clave y nombre son obligatorios.');
            return;
        }
        const res = await fetchApi('/api/accesos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...aForm, clave: aForm.clave.trim(), modulo: aForm.modulo.trim() || null }),
        });
        if (res.success) {
            alert('✅ Módulo/Acceso creado. Ya está disponible en el listado.');
            setAForm({ clave: '', nombre: '', modulo: '', icono: '📌', descripcion: '' });
            loadAccesos(); // actualiza el listado de asignacion
            if (perfilSel != null) loadAsignados(perfilSel);
        } else {
            alert(`❌ ${res.error || 'No se pudo crear el acceso.'}`);
        }
    };

    const eliminarAcceso = async (a: any) => {
        if (!confirm(`¿Eliminar el acceso "${a.nombre}"?`)) return;
        const res = await fetchApi(`/api/accesos/${a.id}`, { method: 'DELETE' });
        if (res.success) {
            alert('✅ Acceso eliminado.');
            loadAccesos();
            if (perfilSel != null) loadAsignados(perfilSel);
        } else {
            alert(`❌ ${res.error || 'No se pudo eliminar el acceso.'}`);
        }
    };

    const guardarUsuario = async (u: any) => {
        const c = usuarioEdit[u.id];
        if (!c) return;
        const res = await fetchApi(`/api/seguridad/usuarios/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ perfil_id: c.perfil_id === '' ? null : c.perfil_id, estatus_usuario: c.estatus_usuario }),
        });
        if (res.success) {
            alert('✅ Usuario actualizado.');
            loadUsuarios();
        } else {
            alert(`❌ ${res.error || 'No se pudo actualizar el usuario.'}`);
        }
    };

    // Agrupar accesos por modulo para el listado de asignacion
    const accesosPorModulo = (() => {
        const map = new Map<string, any[]>();
        accesos.forEach((a) => {
            const grupo = a.modulo || 'General';
            if (!map.has(grupo)) map.set(grupo, []);
            map.get(grupo)!.push(a);
        });
        return [...map.entries()];
    })();

    return (
        <div className="fade-in">
            <div className="org-tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                <button className={`org-tab ${tab === 'perfiles' ? 'active' : ''}`} onClick={() => setTab('perfiles')}>👥 Perfiles</button>
                <button className={`org-tab ${tab === 'accesos' ? 'active' : ''}`} onClick={() => setTab('accesos')}>🔐 Accesos</button>
                <button className={`org-tab ${tab === 'usuarios' ? 'active' : ''}`} onClick={() => setTab('usuarios')}>👤 Usuarios</button>
            </div>

            {/* ── PERFILES ─────────────────────────────────────── */}
            {tab === 'perfiles' && (
                <div>
                    <div className="section-header">
                        <h1>👥 Perfiles</h1>
                        <p>{loadingP ? '⏳ Cargando perfiles...' : `${perfiles.length} perfiles registrados`}</p>
                        <button className="btn btn-primary" onClick={abrirNuevo}>➕ Nuevo Perfil</button>
                    </div>

                    {showForm && (
                        <div className="card" style={{ maxWidth: '720px', margin: '0 auto 1.5rem' }}>
                            <h3 className="mb-md">{editId ? `✏️ Editar Perfil` : '➕ Nuevo Perfil'}</h3>
                            <form className="form" onSubmit={guardarPerfil}>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="label">Clave *</label>
                                        <input className="input" required value={pForm.clave} placeholder="ej. VENTAS"
                                            onChange={(e) => setPForm({ ...pForm, clave: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Nombre *</label>
                                        <input className="input" required value={pForm.nombre} placeholder="ej. Ventas"
                                            onChange={(e) => setPForm({ ...pForm, nombre: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Descripción</label>
                                    <textarea className="input" rows={2} value={pForm.descripcion} placeholder="Descripción del perfil"
                                        onChange={(e) => setPForm({ ...pForm, descripcion: e.target.value })} />
                                </div>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="label">Nivel Jerárquico</label>
                                        <input type="number" className="input" value={pForm.nivel_jerarquico} min={0}
                                            onChange={(e) => setPForm({ ...pForm, nivel_jerarquico: Number(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Estatus</label>
                                        <select className="input" value={pForm.estatus}
                                            onChange={(e) => setPForm({ ...pForm, estatus: e.target.value })}>
                                            <option value="activo">Activo</option>
                                            <option value="inactivo">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" id="es_admin" checked={pForm.es_administrador}
                                        onChange={(e) => setPForm({ ...pForm, es_administrador: e.target.checked })} />
                                    <label htmlFor="es_admin" className="label" style={{ margin: 0 }}>Administrador (acceso total a todos los módulos)</label>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="submit" className="btn btn-primary">💾 Guardar</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {perfiles.length === 0 && !loadingP && (
                        <div className="card empty-state">
                            <div className="empty-icon">👥</div>
                            <h3>Sin perfiles registrados.</h3>
                        </div>
                    )}

                    {perfiles.length > 0 && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Clave</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Nivel</th>
                                        <th>Accesos</th>
                                        <th>Estatus</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {perfiles.map((p: any) => (
                                        <tr key={p.id}>
                                            <td><strong>{p.clave}</strong></td>
                                            <td>
                                                {p.nombre}
                                                {p.es_administrador && <span className="org-badge org-badge-blue" style={{ marginLeft: 6 }}>ADMIN</span>}
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>{p.descripcion || '—'}</td>
                                            <td>{p.nivel_jerarquico}</td>
                                            <td><span className="org-badge org-badge-gray">{p.total_accesos}</span></td>
                                            <td>
                                                <span className={`org-badge ${p.estatus === 'activo' ? 'org-badge-green' : 'org-badge-gray'}`}>{p.estatus}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                        onClick={() => { setPerfilSel(p.id); setTab('accesos'); }}>🔐 Accesos</button>
                                                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                        onClick={() => abrirEdicion(p)}>✏️</button>
                                                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', color: '#ef4444' }}
                                                        onClick={() => eliminarPerfil(p)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── ACCESOS ──────────────────────────────────────── */}
            {tab === 'accesos' && (
                <div>
                    <div className="section-header">
                        <h1>🔐 Asignación de Accesos</h1>
                        <p>Elige un perfil y marca los módulos a los que tendrá acceso</p>
                    </div>

                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="form-group">
                            <label className="label">Perfil</label>
                            <select className="input" value={perfilSel ?? ''} onChange={(e) => setPerfilSel(Number(e.target.value))}>
                                <option value="">Seleccionar perfil...</option>
                                {perfiles.map((p) => (
                                    <option key={p.id} value={p.id}>{p.clave} — {p.nombre}</option>
                                ))}
                            </select>
                        </div>
                        {dirty && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                                <button className="btn btn-primary" onClick={guardarAccesos}>💾 Guardar cambios en accesos</button>
                            </div>
                        )}
                    </div>

                    {perfilSel != null && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 60 }}>Acceso</th>
                                        <th>Módulo / Proceso</th>
                                        <th>Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accesosPorModulo.map(([grupo, items]) => (
                                        <React.Fragment key={grupo}>
                                            <tr>
                                                <td colSpan={3} style={{ background: 'rgba(255,255,255,0.04)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                                    {grupo}
                                                </td>
                                            </tr>
                                            {items.map((a: any) => {
                                                const chk = asignados.has(a.id);
                                                return (
                                                    <tr key={a.id}>
                                                        <td>
                                                            <input type="checkbox" checked={chk} onChange={() => toggleAcceso(a.id)} />
                                                        </td>
                                                        <td>{a.icono} <strong>{a.nombre}</strong> <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>({a.clave})</span></td>
                                                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>{a.descripcion || '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {perfilSel != null && dirty && (
                        <div style={{ marginTop: '0.75rem' }}>
                            <button className="btn btn-primary" onClick={guardarAccesos}>💾 Guardar cambios en accesos</button>
                        </div>
                    )}

                    {/* Gestion de modulos/accesos del sistema */}
                    <div className="card" style={{ marginTop: '2rem' }}>
                        <h3 className="mb-md">🗂️ Gestionar Módulos / Accesos del Sistema</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginBottom: '1rem' }}>
                            Cuando se crea un módulo nuevo, agréguelo aquí y quedará disponible en el listado de asignación.
                        </p>
                        <form className="form" onSubmit={crearAcceso}>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Clave *</label>
                                    <input className="input" value={aForm.clave} placeholder="ej. nomina-extras"
                                        onChange={(e) => setAForm({ ...aForm, clave: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Nombre *</label>
                                    <input className="input" value={aForm.nombre} placeholder="ej. Extras de Nómina"
                                        onChange={(e) => setAForm({ ...aForm, nombre: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="label">Módulo (grupo del menú)</label>
                                    <input className="input" value={aForm.modulo} placeholder="ej. nomina"
                                        onChange={(e) => setAForm({ ...aForm, modulo: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Icono</label>
                                    <input className="input" value={aForm.icono} maxLength={4}
                                        onChange={(e) => setAForm({ ...aForm, icono: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Descripción</label>
                                <input className="input" value={aForm.descripcion}
                                    onChange={(e) => setAForm({ ...aForm, descripcion: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary">➕ Agregar Módulo/Acceso</button>
                        </form>

                        <div style={{ marginTop: '1rem' }}>
                            <h4 className="mb-md">Accesos existentes</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {accesos.map((a: any) => (
                                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div>
                                            <strong>{a.icono} {a.nombre}</strong>
                                            <span style={{ marginLeft: 8, color: 'var(--gray-400)', fontSize: '0.8rem' }}>{a.modulo} · {a.clave}</span>
                                        </div>
                                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                                            onClick={() => eliminarAcceso(a)}>🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── USUARIOS ─────────────────────────────────────── */}
            {tab === 'usuarios' && (
                <div>
                    <div className="section-header">
                        <h1>👤 Configuración de Usuarios</h1>
                        <p>Asigna el perfil y el estatus de acceso de cada usuario</p>
                    </div>

                    {usuarios.length === 0 && (
                        <div className="card empty-state">
                            <div className="empty-icon">👤</div>
                            <h3>Sin usuarios registrados.</h3>
                        </div>
                    )}

                    {usuarios.length > 0 && (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Departamento</th>
                                        <th>Perfil</th>
                                        <th>Estatus</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map((u: any) => {
                                        const edit = usuarioEdit[u.id] || { perfil_id: u.perfil_id ?? '', estatus_usuario: u.estatus_usuario || 'activo' };
                                        return (
                                            <tr key={u.id}>
                                                <td>
                                                    <strong>{u.nombre} {u.apellido_paterno}</strong><br />
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>#{u.numero_empleado}{u.perfil_admin ? ' · 🛡️ Administrador' : ''}</span>
                                                </td>
                                                <td>{u.departamento || '—'}</td>
                                                <td>
                                                    <select className="input" value={String(edit.perfil_id)}
                                                        onChange={(e) => setUsuarioEdit({ ...usuarioEdit, [u.id]: { ...edit, perfil_id: e.target.value === '' ? '' : Number(e.target.value) } })}>
                                                        <option value="">Sin perfil</option>
                                                        {perfiles.map((p) => (
                                                            <option key={p.id} value={p.id}>{p.clave}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <select className="input" value={edit.estatus_usuario}
                                                        onChange={(e) => setUsuarioEdit({ ...usuarioEdit, [u.id]: { ...edit, estatus_usuario: e.target.value } })}>
                                                        {Object.entries(ESTATUS_USUARIO).map(([v, lbl]) => (
                                                            <option key={v} value={v}>{lbl}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        onClick={() => guardarUsuario(u)}>💾 Guardar</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConfiguracionModule;