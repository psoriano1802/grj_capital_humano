// Servicio de reconocimiento facial en el navegador (@vladmandic/face-api + TensorFlow.js).
// Extrae un descriptor (vector de 128 floats) a partir de la cámara y lo envía al backend,
// que lo compara contra los descriptores enrolados (motor 'descriptor').

// Import dinámico: face-api + TensorFlow.js (~1.6MB) se carga solo al usar la cámara,
// evitando inflar el bundle principal de la app.
type FaceApiModule = typeof import('@vladmandic/face-api');

const MODELS_URL = '/models';

let faceapi: FaceApiModule | null = null;
let modelsLoaded = false;

async function getFaceApi(): Promise<FaceApiModule> {
    if (!faceapi) {
        faceapi = await import('@vladmandic/face-api');
    }
    return faceapi;
}

export async function loadFaceModels(): Promise<void> {
    if (modelsLoaded) {
        return;
    }
    const api = await getFaceApi();
    await api.nets.tinyFaceDetector.loadFromUri(MODELS_URL);
    await api.nets.faceLandmark68Net.loadFromUri(MODELS_URL);
    await api.nets.faceRecognitionNet.loadFromUri(MODELS_URL);
    modelsLoaded = true;
}

export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
    });
    video.srcObject = stream;
    await video.play();
    return stream;
}

export function stopCamera(stream: MediaStream | null): void {
    stream?.getTracks().forEach((t) => t.stop());
}

export interface FaceDescriptor {
    descriptor: number[];
    hasFace: boolean;
}

export async function extractDescriptor(video: HTMLVideoElement): Promise<FaceDescriptor> {
    const api = await getFaceApi();
    await loadFaceModels();
    const detection = await api
        .detectSingleFace(video, new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        return { descriptor: [], hasFace: false };
    }
    return { descriptor: Array.from(detection.descriptor), hasFace: true };
}

export function descriptorToPayload(descriptor: number[]): string {
    return JSON.stringify(descriptor);
}