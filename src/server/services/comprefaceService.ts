import dotenv from 'dotenv';

dotenv.config();

export interface FaceMatch {
    sujeto: string | null;
    similitud: number;
}

interface RecognizeSubject {
    subject?: string;
    similarity?: number;
}

interface RecognizeResponse {
    result?: Array<{
        box?: unknown;
        subjects?: RecognizeSubject[];
    }>;
}

function cleanBase64(b64: string): string {
    const marker = 'base64,';
    const idx = b64.indexOf(marker);
    return idx !== -1 ? b64.slice(idx + marker.length) : b64;
}

function bestMatch(json: RecognizeResponse): FaceMatch {
    const results = json?.result;
    if (!Array.isArray(results) || results.length === 0) {
        return { sujeto: null, similitud: 0 };
    }
    const subjects = Array.isArray(results[0]?.subjects) ? results[0].subjects! : [];
    if (subjects.length === 0) {
        return { sujeto: null, similitud: 0 };
    }
    const best = subjects.reduce((a, b) =>
        (b.similarity ?? 0) > (a.similarity ?? 0) ? b : a
    );
    return { sujeto: best.subject ?? null, similitud: best.similarity ?? 0 };
}

class ComprefaceService {
    private baseUrl: string;
    private apiKey: string;
    private threshold: number;

    constructor() {
        this.baseUrl = (process.env.COMPREFACE_URL || 'http://localhost:8000').replace(/\/+$/, '');
        this.apiKey = process.env.COMPREFACE_API_KEY || '';
        this.threshold = parseFloat(process.env.COMPREFACE_SIMILARITY_THRESHOLD || '0.7');
    }

    private static headers(apiKey: string): Record<string, string> {
        return { 'x-api-key': apiKey };
    }

    // Alta o actualización del rostro de un empleado ante CompreFace.
    async enrollFace(empleadoId: number, imageB64: string): Promise<boolean> {
        const url = `${this.baseUrl}/api/v1/recognition/faces`;
        const body =
            `subject=${encodeURIComponent(String(empleadoId))}` +
            `&image_file_b64=${encodeURIComponent(cleanBase64(imageB64))}`;
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { ...ComprefaceService.headers(this.apiKey), 'Content-Type': 'application/x-www-form-urlencoded' },
                body,
            });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Error al enrolar rostro: HTTP ${resp.status} ${text}`);
            }
            return true;
        } catch (error: any) {
            if (error instanceof Error && /HTTP \d/.test(error.message)) {
                throw error;
            }
            throw new Error(`Servicio de reconocimiento no disponible: ${error.message}`);
        }
    }

    // Dado un frame, devuelve el sujeto (empleado_id) y la similitud del mejor match.
    async identify(imageB64: string): Promise<FaceMatch> {
        const url = `${this.baseUrl}/api/v1/recognition/recognize`;
        const body = `image_file_b64=${encodeURIComponent(cleanBase64(imageB64))}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { ...ComprefaceService.headers(this.apiKey), 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        if (!resp.ok) {
            throw new Error(`Error en reconocimiento facial: HTTP ${resp.status}`);
        }
        const json = (await resp.json()) as RecognizeResponse;
        return bestMatch(json);
    }

    // Verifica que el frame corresponde al empleado indicado con similitud >= umbral.
    async isFaceMatch(empleadoId: number, imageB64: string): Promise<boolean> {
        const match = await this.identify(imageB64);
        if (match.sujeto === null) {
            return false;
        }
        return String(empleadoId) === match.sujeto && match.similitud >= this.threshold;
    }

    // Baja lógica del rostro ante CompreFace (sujeto = empleado_id).
    async deleteFace(empleadoId: number): Promise<boolean> {
        const url = `${this.baseUrl}/api/v1/recognition/faces?subject=${encodeURIComponent(String(empleadoId))}`;
        try {
            const resp = await fetch(url, { method: 'DELETE', headers: ComprefaceService.headers(this.apiKey) });
            return resp.ok;
        } catch (error: any) {
            throw new Error(`Servicio de reconocimiento no disponible: ${error.message}`);
        }
    }
}

export default new ComprefaceService();