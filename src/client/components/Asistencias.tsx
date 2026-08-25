import React, { useState, useEffect } from 'react';
import BiometricAuth from './BiometricAuth';
import { useSession } from '../services/SessionContext';
import { asistenciasAPI } from '../services/api';

const fetchApi = async (url: string, options?: RequestInit) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        return { success: false, data: null };
    }
};

interface AsistenciasModuleProps {
    initialTab?: 'registro-asistencia' | 'reporte-asistencias';
}

const AsistenciasModule: React.FC<AsistenciasModuleProps> = ({ initialTab = 'registro-asistencia' }) => {
    const { currentUser } = useSession();
    const [tab, setTab] = useState(initialTab);
    const [asistencias, setAsistencias] = useState<any[]>([]);

    useEffect(() => { setTab(initialTab); }, [initialTab]);

    useEffect(() => {
        if (tab === 'reporte-asistencias') {
            loadReporte();
        }
    }, [tab]);

    const loadReporte = async () => {
        const res = await fetchApi('/api/asistencias');
        if (res.success && Array.isArray(res.data)) {
            setAsistencias(res.data);
        } else {
            setAsistencias([]);
        }
    };

    const handleMarcar = async (datos: string) => {
        try {
            const mensaje = await marcarAsistencia(datos);
            alert(mensaje);
        } catch (error: any) {
            alert(error.message || 'Error de conexión con el biométrico o servidor');
        }
    };

    const marcarAsistencia = async (datos: string): Promise<string> => {
        const res = await asistenciasAPI.marcar({
            empleado_id: currentUser?.id ?? null,
            tipo_registro: 'faceid',
            datos_biometricos: datos
        });

        if (res.success) {
            const nombre = currentUser?.numero_empleado || `#${currentUser?.id}`;
            return res.accion === 'entrada'
                ? `✅ Entrada registrada para ${nombre}`
                : `✅ Salida registrada para ${nombre}`;
        }
        throw new Error(res.error || 'Error al registrar la asistencia');
    };

    return (
        <div className="fade-in">
            <div className="org-tabs" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                <button className={`org-tab ${tab === 'registro-asistencia' ? 'active' : ''}`} onClick={() => setTab('registro-asistencia')}>✅ Registro Biométrico</button>
                <button className={`org-tab ${tab === 'reporte-asistencias' ? 'active' : ''}`} onClick={() => setTab('reporte-asistencias')}>📊 Reporte</button>
            </div>

            {tab === 'registro-asistencia' && (
                <div>
                    <div className="section-header">
                        <h1>⏰ Control de Asistencia</h1>
                        <p>Una sola marcada: si no hay registro hoy se toma como entrada; si ya existe, como salida</p>
                    </div>

                    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <BiometricAuth
                            modo="marcar"
                            empleadoPredefino={currentUser?.id}
                            onMarcar={handleMarcar}
                        />
                    </div>
                </div>
            )}

            {tab === 'reporte-asistencias' && (
                <div>
                    <div className="section-header">
                        <h1>📊 Reporte de Asistencias</h1>
                        <p>Historial de entradas y salidas del personal</p>
                    </div>
                    <div className="card">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Empleado</th>
                                        <th>Hora Entrada</th>
                                        <th>Hora Salida</th>
                                        <th>Estatus</th>
                                        <th>Método</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {asistencias.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                                                No hay registros de asistencias para mostrar.
                                            </td>
                                        </tr>
                                    ) : (
                                        asistencias.map((a, idx) => (
                                            <tr key={idx}>
                                                <td>{a.fecha ? new Date(a.fecha).toLocaleDateString() : '--'}</td>
                                                <td>
                                                    {a.numero_empleado
                                                        ? `${a.numero_empleado} — ${a.nombre} ${a.apellido_paterno ?? ''}`
                                                        : a.empleado_id}
                                                </td>
                                                <td>{a.hora_entrada ? new Date(a.hora_entrada).toLocaleTimeString() : '--'}</td>
                                                <td>{a.hora_salida ? new Date(a.hora_salida).toLocaleTimeString() : '--'}</td>
                                                <td><span className="org-badge org-badge-green">{a.estatus}</span></td>
                                                <td>{a.tipo_registro}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsistenciasModule;