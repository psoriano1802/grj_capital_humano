import React, { useEffect, useRef, useState } from 'react';
import './BiometricAuth.css';
import {
    descriptorToPayload,
    extractDescriptor,
    loadFaceModels,
    startCamera,
    stopCamera
} from '../services/faceRecognition';

interface BiometricAuthProps {
    modo: 'marcar' | 'enrolar';
    empleadoPredefino?: number | string | null | undefined;
    tipo?: 'entrada' | 'salida';
    onMarcar?: (datos: string) => void | Promise<void>;
    onEnroll?: (empleadoId: number, datos: string) => boolean | void | Promise<boolean | void>;
    onCapture?: (datos: string) => void | Promise<void>;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({
    modo,
    empleadoPredefino,
    tipo,
    onMarcar,
    onEnroll,
    onCapture
}) => {
    const [selectedMethod, setSelectedMethod] = useState<'faceid' | 'huella' | null>(null);
    const [camaraActiva, setCamaraActiva] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => stopCamera(streamRef.current);
    }, []);

    const detenerCamara = () => {
        stopCamera(streamRef.current);
        streamRef.current = null;
        setCamaraActiva(false);
    };

    const seleccionarMetodo = (metodo: 'faceid' | 'huella') => {
        if (metodo !== 'faceid') {
            detenerCamara();
        }
        setSelectedMethod(metodo);
        setStatus('');
    };

    const iniciarCamara = async () => {
        if (!videoRef.current) return;
        setStatus(empleadoPredefino ? 'Cargando modelos de reconocimiento facial...' : 'Selecciona un empleado en el selector para continuar.');
        try {
            await loadFaceModels();
            streamRef.current = await startCamera(videoRef.current);
            setCamaraActiva(true);
            setStatus('Cámara lista. Presiona "Capturar".');
        } catch (err: any) {
            setStatus(`Error al iniciar la cámara: ${err?.message || 'acceso denegado'}`);
        }
    };

    const capturar = async () => {
        if (!videoRef.current || isScanning) return;
        setIsScanning(true);
        setStatus('Analizando rostro...');
        try {
            const { descriptor, hasFace } = await extractDescriptor(videoRef.current);

            if (!hasFace || descriptor.length === 0) {
                setStatus('No se detectó un rostro. Acércate iluminado y vuelve a intentar.');
                return;
            }
            const payload = descriptorToPayload(descriptor);

            if (modo === 'enrolar') {
                if (onCapture) {
                    await onCapture(payload);
                    setStatus('Rostro capturado correctamente.');
                    detenerCamara();
                } else {
                    const id = empleadoPredefino;
                    if (!Number.isInteger(id) || (id ?? 0) <= 0) {
                        setStatus('Selecciona un empleado en el selector antes de enrolar.');
                        return;
                    }
                    const ok = onEnroll ? Boolean(await onEnroll(id as number, payload)) : true;
                    setStatus(ok ? `Rostro enrolado para el empleado #${id}.` : 'Error al enrolar el rostro. Intenta de nuevo.');
                    if (ok) {
                        detenerCamara();
                    }
                }
            } else {
                if (!empleadoPredefino) {
                    setStatus('Selecciona un empleado en el selector antes de marcar.');
                    return;
                }
                if (onMarcar) {
                    await onMarcar(payload);
                }
                setStatus('Procesando marcado...');
                detenerCamara();
            }
        } catch (err: any) {
            setStatus(`Error al capturar: ${err?.message || 'desconocido'}`);
        } finally {
            setIsScanning(false);
        }
    };

    const escanearHuella = () => {
        if (!empleadoPredefino) {
            setStatus('Selecciona un empleado en el selector.');
            return;
        }
        setIsScanning(true);
        setStatus('Escaneando huella...');
        setTimeout(() => {
            const datos = `huella_${Date.now()}_${Math.random()}`;
            if (modo === 'marcar' && onMarcar) {
                onMarcar(datos);
            }
            setIsScanning(false);
            setStatus('Huella procesada (simulación).');
        }, 1500);
    };

    const titulo = tipo ? `Registro de ${tipo === 'entrada' ? 'Entrada' : 'Salida'}` : 'Registro de Asistencia';

    return (
        <div className="biometric-auth">
            <div className="auth-header">
                <h2>{titulo}</h2>
                <p>{modo === 'enrolar' ? 'Captura el rostro para enrolarlo' : 'Marca tu entrada o salida'}</p>
            </div>

            {status && <p className="status-text">{status}</p>}

            <div className="auth-methods">
                <button
                    className={`auth-method ${selectedMethod === 'faceid' ? 'selected' : ''}`}
                    onClick={() => seleccionarMetodo('faceid')}
                    disabled={isScanning}
                >
                    <div className="method-icon">😊</div>
                    <div className="method-name">Face ID</div>
                    <div className="method-description">Reconocimiento facial</div>
                </button>

                <button
                    className={`auth-method ${selectedMethod === 'huella' ? 'selected' : ''}`}
                    onClick={() => seleccionarMetodo('huella')}
                    disabled={isScanning || modo === 'enrolar'}
                >
                    <div className="method-icon">👆</div>
                    <div className="method-name">Huella Dactilar</div>
                    <div className="method-description">Sensor de huella</div>
                </button>
            </div>

            {selectedMethod && (
                <div className="scan-area">
                    {selectedMethod === 'faceid' ? (
                        <div>
                            <div className="camera-box">
                                <video ref={videoRef} playsInline muted hidden={!camaraActiva} />
                                {!camaraActiva && (
                                    <div className="camera-placeholder">🎥 Cámara apagada</div>
                                )}
                            </div>
                            {!camaraActiva ? (
                                <button className="btn btn-primary btn-large" onClick={iniciarCamara} disabled={isScanning}>
                                    <span>📷</span> Iniciar Cámara
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-primary btn-large" onClick={capturar} disabled={isScanning}>
                                        <span>🔒</span> Capturar
                                    </button>
                                    <button className="btn btn-secondary btn-large" onClick={detenerCamara} disabled={isScanning}>
                                        Detener
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="btn btn-primary btn-large" onClick={escanearHuella} disabled={isScanning}>
                            <span>🔐</span> Iniciar Escaneo
                        </button>
                    )}
                </div>
            )}

            <div className="auth-info">
                <div className="info-item">
                    <span className="info-icon">🕐</span>
                    <span className="info-text">Hora actual: {new Date().toLocaleTimeString()}</span>
                </div>
                <div className="info-item">
                    <span className="info-icon">🏷️</span>
                    <span className="info-text">{empleadoPredefino ? `Empleado: ${empleadoPredefino}` : 'Sin empleado seleccionado'}</span>
                </div>
            </div>
        </div>
    );
};

export default BiometricAuth;