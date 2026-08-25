import React, { useEffect, useState } from 'react';
import BiometricAuth from './BiometricAuth';
import { useSession } from '../services/SessionContext';
import { asistenciasAPI } from '../services/api';

interface RostroRow {
    empleado_id: number;
    numero_empleado: string;
    nombre: string;
    apellido_paterno?: string | null;
    apellido_materno?: string | null;
    activo: boolean;
    fecha_registro: string;
}

const BiometricoConfig: React.FC = () => {
    const { currentUser } = useSession();
    const [rostros, setRostros] = useState<RostroRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toggling, setToggling] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    const cargar = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/asistencias/rostros');
            const json = await res.json();
            if (json.success) {
                setRostros(json.data || []);
                setError('');
            } else {
                setError(json.error || 'Error al cargar');
            }
        } catch (e: any) {
            setError(e.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const toggle = async (r: RostroRow) => {
        setToggling(r.empleado_id);
        try {
            await fetch(`/api/asistencias/rostros/${r.empleado_id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo: !r.activo })
            });
            await cargar();
        } catch (e: any) {
            setError(e.message || 'Error al actualizar');
        } finally {
            setToggling(null);
        }
    };

    const handleEnroll = async (empleadoId: number, datos: string): Promise<boolean> => {
        try {
            const res = await asistenciasAPI.registrarBiometrico({
                empleado_id: empleadoId,
                tipo: 'faceid',
                datos_biometricos: datos
            });
            setMessage(res.message || (res.success ? 'Rostro enrollado' : 'Error al enrolar'));
            if (res.success) {
                await cargar();
            }
            return Boolean(res.success);
        } catch (e: any) {
            setMessage(e.message || 'Error al enrolar');
            return false;
        }
    };

    return (
        <div className="fade-in">
            <div className="section-header">
                <h1>🔐 Configuración Biométrica</h1>
                <p>Gestión de rostros enrolados para Face ID</p>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="mb-md">Enrolar rostro</h3>
                <BiometricAuth modo="enrolar" empleadoPredefino={currentUser?.id} onEnroll={handleEnroll} />
            </div>

            {message && <p className="status-text">{message}</p>}

            {error && <div className="status-text">{error}</div>}
            {loading && <p>Cargando rostros enrolados...</p>}

            {!loading && !error && (
                <div className="card">
                    {rostros.length === 0 ? (
                        <p style={{ padding: '1.5rem', color: 'var(--gray-500)' }}>
                            No hay rostros enrolados. Usa "Enrolar rostro" desde el Registro de Asistencia.
                        </p>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Estado</th>
                                        <th>Registrado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rostros.map((r) => (
                                        <tr key={r.empleado_id}>
                                            <td>
                                                {r.numero_empleado} — {r.nombre} {r.apellido_paterno ?? ''}
                                            </td>
                                            <td>
                                                <span className={`org-badge ${r.activo ? 'org-badge-green' : 'org-badge-red'}`}>
                                                    {r.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                {r.fecha_registro ? new Date(r.fecha_registro).toLocaleString() : '--'}
                                            </td>
                                            <td>
                                                <button
                                                    className={`btn ${r.activo ? 'btn-secondary' : 'btn-primary'}`}
                                                    onClick={() => toggle(r)}
                                                    disabled={toggling === r.empleado_id}
                                                >
                                                    {r.activo ? 'Desactivar' : 'Activar'}
                                                </button>
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

export default BiometricoConfig;