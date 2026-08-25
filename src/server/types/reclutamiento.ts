// Tipos del módulo de reclutamiento

export interface Vacante {
    id?: number;
    titulo: string;
    departamento?: string;
    descripcion?: string;
    requisitos?: string;
    salario_min?: number;
    salario_max?: number;
    num_plazas?: number;
    modalidad?: 'presencial' | 'remoto' | 'hibrido';
    estatus?: 'activa' | 'pausada' | 'cerrada' | 'cancelada';
    fecha_apertura?: Date;
    fecha_cierre?: Date;
    created_by?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface Aspirante {
    id?: number;
    vacante_id?: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    telefono?: string;
    fecha_nacimiento?: Date;
    fuente_reclutamiento?: string;  // cat: fuente_reclutamiento
    cv_url?: string;
    foto_url?: string;
    etapa_actual?: string;          // cat: etapa_proceso
    estatus?: string;               // cat: estatus_aspirante
    salario_pretendido?: number;
    disponibilidad?: string;
    notas?: string;
    motivo_rechazo?: string;        // cat: motivo_rechazo
    created_at?: Date;
    updated_at?: Date;
}

export interface Entrevista {
    id?: number;
    aspirante_id: number;
    entrevistador?: string;
    tipo: string;                   // cat: tipo_entrevista
    fecha_hora: Date;
    duracion_min?: number;
    lugar_liga?: string;
    estatus?: 'programada' | 'realizada' | 'cancelada' | 'no_presentado';
    calificacion?: number;
    comentarios?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface PruebaAspirante {
    id?: number;
    aspirante_id: number;
    tipo_prueba: string;            // cat: tipo_prueba
    fecha_aplicacion: Date;
    resultado?: string;             // cat: resultado_prueba
    calificacion?: number;
    observaciones?: string;
    archivo_url?: string;
    aplicada_por?: string;
    created_at?: Date;
}

export interface DocumentoAspirante {
    id?: number;
    aspirante_id: number;
    tipo_documento: string;         // cat: doc_aspirante
    nombre_archivo?: string;
    archivo_url?: string;
    estatus?: 'pendiente' | 'recibido' | 'validado' | 'rechazado';
    notas?: string;
    created_at?: Date;
}

// DTOs
export interface CreateVacanteDTO {
    titulo: string;
    departamento?: string;
    descripcion?: string;
    requisitos?: string;
    salario_min?: number;
    salario_max?: number;
    num_plazas?: number;
    modalidad?: string;
    fecha_cierre?: string;
    created_by?: number;
}

export interface CreateAspiranteDTO {
    vacante_id?: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    telefono?: string;
    fecha_nacimiento?: string;
    fuente_reclutamiento?: string;
    salario_pretendido?: number;
    disponibilidad?: string;
    notas?: string;
}

export interface CreateEntrevistaDTO {
    aspirante_id: number;
    entrevistador?: string;
    tipo: string;
    fecha_hora: string;
    duracion_min?: number;
    lugar_liga?: string;
}

export interface CreatePruebaDTO {
    aspirante_id: number;
    tipo_prueba: string;
    fecha_aplicacion: string;
    resultado?: string;
    calificacion?: number;
    observaciones?: string;
    aplicada_por?: string;
}

export interface AvanzarEtapaDTO {
    aspirante_id: number;
    nueva_etapa: string;
    nuevo_estatus?: string;
    motivo_rechazo?: string;
    notas?: string;
}
