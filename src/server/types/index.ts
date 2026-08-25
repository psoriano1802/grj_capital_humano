// Tipos de datos para el sistema de RH

export interface Empleado {
    id?: number;
    numero_empleado: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    telefono?: string;
    fecha_nacimiento?: Date;
    fecha_ingreso: Date;
    puesto?: string;
    departamento?: string;
    salario?: number;
    tipo_contratacion?: string;
    tipo_empleado?: string;
    tipo_jornada?: string;
    turno?: string;
    horario_laboral?: string;
    esquema_pago?: string;
    tipo_contrato?: string;
    estatus?: 'activo' | 'inactivo' | 'suspendido';
    foto_url?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Biometrico {
    id?: number;
    empleado_id: number;
    tipo: 'faceid' | 'huella';
    datos_biometricos: string;
    activo?: boolean;
    fecha_registro?: Date;
}

export interface Asistencia {
    id?: number;
    empleado_id: number;
    fecha: Date;
    hora_entrada?: Date;
    hora_salida?: Date;
    tipo_registro?: 'faceid' | 'huella' | 'manual';
    estatus?: 'presente' | 'tarde' | 'falta' | 'justificado';
    notas?: string;
    created_at?: Date;
}

export interface Permiso {
    id?: number;
    empleado_id: number;
    tipo_permiso: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    horas_solicitadas?: number;
    motivo: string;
    estatus?: 'pendiente' | 'aprobado' | 'rechazado';
    aprobado_por?: number;
    fecha_aprobacion?: Date;
    comentarios_aprobacion?: string;
    documento_url?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Vacacion {
    id?: number;
    empleado_id: number;
    periodo_year: number;
    dias_disponibles: number;
    dias_tomados?: number;
    dias_pendientes: number;
    fecha_inicio?: Date;
    fecha_fin?: Date;
    estatus?: 'pendiente' | 'aprobado' | 'rechazado' | 'en_curso' | 'completado';
    aprobado_por?: number;
    fecha_aprobacion?: Date;
    comentarios?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Incapacidad {
    id?: number;
    empleado_id: number;
    tipo_incapacidad: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    dias_totales: number;
    folio_incapacidad?: string;
    institucion?: 'IMSS' | 'ISSSTE' | 'Particular';
    diagnostico?: string;
    documento_url?: string;
    estatus?: 'activa' | 'finalizada' | 'cancelada';
    created_at?: Date;
    updated_at?: Date;
}

export interface Usuario {
    id?: number;
    empleado_id: number;
    username: string;
    password_hash: string;
    rol: 'admin' | 'rh' | 'empleado' | 'supervisor';
    ultimo_acceso?: Date;
    activo?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface Catalogo {
    id?: number;
    categoria: string;
    clave: string;
    valor: string;
    descripcion?: string;
    activo?: boolean;
    orden?: number;
}

export interface Configuracion {
    id?: number;
    clave: string;
    valor: string;
    tipo: 'string' | 'number' | 'boolean' | 'json';
    descripcion?: string;
    updated_at?: Date;
}

// DTOs para requests
export interface CreateEmpleadoDTO {
    numero_empleado: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    telefono?: string;
    fecha_nacimiento?: string;
    fecha_ingreso: string;
    puesto?: string;
    departamento?: string;
    salario?: number;
    tipo_contratacion?: string;
    tipo_empleado?: string;
    tipo_jornada?: string;
    turno?: string;
    horario_laboral?: string;
    esquema_pago?: string;
    tipo_contrato?: string;
}

export interface CreatePermisoDTO {
    empleado_id: number;
    tipo_permiso: string;
    fecha_inicio: string;
    fecha_fin: string;
    horas_solicitadas?: number;
    motivo: string;
}

export interface CreateVacacionDTO {
    empleado_id: number;
    periodo_year: number;
    fecha_inicio: string;
    fecha_fin: string;
    dias_solicitados: number;
}

export interface CreateIncapacidadDTO {
    empleado_id: number;
    tipo_incapacidad: string;
    fecha_inicio: string;
    fecha_fin: string;
    folio_incapacidad?: string;
    institucion?: string;
    diagnostico?: string;
}

export interface BiometricAuthDTO {
    empleado_id: number;
    tipo: 'faceid' | 'huella';
    datos_biometricos: string;
}

export interface RegistrarAsistenciaDTO {
    empleado_id?: number | null;
    tipo_registro: 'faceid' | 'huella' | 'manual';
    datos_biometricos?: string;
}

// Seguridad: perfiles y accesos
export interface CreatePerfilDTO {
    clave: string;
    nombre: string;
    descripcion?: string | null;
    nivel_jerarquico?: number;
    es_administrador?: boolean;
    estatus?: string;
}

export interface UpdatePerfilDTO extends Partial<CreatePerfilDTO> {}

export interface CreateAccesoDTO {
    clave: string;
    nombre: string;
    descripcion?: string | null;
    modulo?: string | null;
    icono?: string;
    ruta?: string;
    estatus?: string;
    orden?: number;
}

export interface UpdateAccesoDTO extends Partial<CreateAccesoDTO> {}

export interface SetPerfilAccesosDTO {
    acceso_ids: number[];
}

export interface UpdateUsuarioSeguridadDTO {
    perfil_id?: number | null;
    estatus_usuario?: string;
}

// Respuestas
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
