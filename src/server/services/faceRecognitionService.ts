import dotenv from 'dotenv';
import { pool } from '../database/connection';
import comprefaceService from './comprefaceService';

dotenv.config();

export interface FaceMatch {
    sujeto: string | null;
    similitud: number;
}

export interface FaceRecognitionEngine {
    enroll(empleadoId: number, datos: string): Promise<void>;
    identify(datos: string): Promise<FaceMatch>;
    isFaceMatch(empleadoId: number, datos: string): Promise<boolean>;
}

// ── Motor local: el descriptor se extrae en el navegador (face-api) y se compara
//    por distancia euclidiana contra lo guardado en `biometricos`. Zero infraestructura.
class DescriptorEngine implements FaceRecognitionEngine {
    private threshold: number;

    constructor() {
        this.threshold = parseFloat(process.env.FACE_DISTANCE_THRESHOLD || '0.5');
    }

    // El descriptor llega como JSON string "[0.01, -0.02, ...]" (128 floats)
    private static parseDescriptor(datos: string): number[] {
        const cleaned = datos.trim().replace(/^data:image\/[^;]+;base64,/, '');
        try {
            const parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                throw new Error('Descriptor de rostro inválido');
            }
            return parsed.map((n: unknown) => parseFloat(String(n)));
        } catch {
            throw new Error('Descriptor de rostro inválido');
        }
    }

    private static distance(a: number[], b: number[]): number {
        if (a.length !== b.length) return Infinity;
        let sum = 0;
        for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
        return Math.sqrt(sum);
    }

    async enroll(empleadoId: number, datos: string): Promise<void> {
        const descriptor = DescriptorEngine.parseDescriptor(datos);
        const query = `
      INSERT INTO biometricos (empleado_id, tipo, datos_biometricos)
      VALUES ($1, 'faceid', $2)
      ON CONFLICT (empleado_id, tipo)
      DO UPDATE SET datos_biometricos = $2, activo = true, fecha_registro = CURRENT_TIMESTAMP
    `;
        await pool.query(query, [empleadoId, JSON.stringify(descriptor)]);
    }

    async identify(datos: string): Promise<FaceMatch> {
        const query = `SELECT empleado_id, datos_biometricos FROM biometricos WHERE tipo = 'faceid' AND activo = true`;
        const result = await pool.query(query);
        const provided = DescriptorEngine.parseDescriptor(datos);

        let best: { empleadoId: number; dist: number } | null = null;
        for (const row of result.rows) {
            let stored: number[];
            try {
                stored = DescriptorEngine.parseDescriptor(row.datos_biometricos);
            } catch {
                continue;
            }
            const dist = DescriptorEngine.distance(provided, stored);
            if (best === null || dist < best.dist) {
                best = { empleadoId: row.empleado_id, dist };
            }
        }

        if (!best) return { sujeto: null, similitud: 0 };
        if (best.dist > this.threshold) return { sujeto: null, similitud: Math.max(0, 1 - best.dist) };
        return { sujeto: String(best.empleadoId), similitud: Math.max(0, 1 - best.dist) };
    }

    async isFaceMatch(empleadoId: number, datos: string): Promise<boolean> {
        const match = await this.identify(datos);
        return match.sujeto !== null && String(empleadoId) === match.sujeto;
    }
}

// ── Motor CompreFace: mismo contrato, pero el matching lo hace el servicio externo.
class ComprefaceEngine implements FaceRecognitionEngine {
    private threshold: number;

    constructor() {
        this.threshold = parseFloat(process.env.COMPREFACE_SIMILARITY_THRESHOLD || '0.7');
    }

    async enroll(empleadoId: number, datos: string): Promise<void> {
        await comprefaceService.enrollFace(empleadoId, datos);

        // Ledger del enrolamiento en BD (el embedding vive en CompreFace)
        const query = `
      INSERT INTO biometricos (empleado_id, tipo, datos_biometricos)
      VALUES ($1, 'faceid', $2)
      ON CONFLICT (empleado_id, tipo)
      DO UPDATE SET fecha_registro = CURRENT_TIMESTAMP
    `;
        await pool.query(query, [empleadoId, 'registrado']);
    }

    async identify(datos: string): Promise<FaceMatch> {
        const match = await comprefaceService.identify(datos);
        if (match.sujeto === null || match.similitud < this.threshold) {
            return { sujeto: null, similitud: match.similitud };
        }
        return match;
    }

    async isFaceMatch(empleadoId: number, datos: string): Promise<boolean> {
        return comprefaceService.isFaceMatch(empleadoId, datos);
    }
}

function createEngine(): FaceRecognitionEngine {
    const engine = (process.env.FACE_RECOGNITION_ENGINE || 'descriptor').toLowerCase();
    if (engine === 'compreface') {
        return new ComprefaceEngine();
    }
    return new DescriptorEngine();
}

export const faceRecognitionEngine = createEngine();
export default faceRecognitionEngine;