// API Service para comunicación con el backend

const API_BASE_URL = '/api';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}


// Empleados
export const empleadosAPI = {
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/empleados`);
        return response.json();
    },

    getById: async (id: number) => {
        const response = await fetch(`${API_BASE_URL}/empleados/${id}`);
        return response.json();
    },

    create: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/empleados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    update: async (id: number, data: any) => {
        const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    search: async (query: string) => {
        const response = await fetch(`${API_BASE_URL}/empleados/search?q=${encodeURIComponent(query)}`);
        return response.json();
    }
};

// Asistencias
export const asistenciasAPI = {
    marcar: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/asistencias/marcar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    registrarEntrada: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/asistencias/entrada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    registrarSalida: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/asistencias/salida`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    registrarBiometrico: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/asistencias/biometrico`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    getByEmpleado: async (empleadoId: number, fechaInicio?: string, fechaFin?: string) => {
        let url = `${API_BASE_URL}/asistencias/empleado/${empleadoId}`;
        if (fechaInicio && fechaFin) {
            url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
        }
        const response = await fetch(url);
        return response.json();
    },

    getDelDia: async (fecha?: string) => {
        const url = fecha
            ? `${API_BASE_URL}/asistencias/dia/${fecha}`
            : `${API_BASE_URL}/asistencias/dia`;
        const response = await fetch(url);
        return response.json();
    },

    getReporte: async (fechaInicio: string, fechaFin: string) => {
        const response = await fetch(
            `${API_BASE_URL}/asistencias/reporte?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
        );
        return response.json();
    }
};

// Permisos
export const permisosAPI = {
    create: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/permisos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    getByEmpleado: async (empleadoId: number) => {
        const response = await fetch(`${API_BASE_URL}/permisos/empleado/${empleadoId}`);
        return response.json();
    },

    getPendientes: async () => {
        const response = await fetch(`${API_BASE_URL}/permisos/pendientes`);
        return response.json();
    },

    aprobar: async (id: number, aprobadoPor: number, comentarios?: string) => {
        const response = await fetch(`${API_BASE_URL}/permisos/${id}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aprobado_por: aprobadoPor, comentarios })
        });
        return response.json();
    },

    rechazar: async (id: number, aprobadoPor: number, comentarios: string) => {
        const response = await fetch(`${API_BASE_URL}/permisos/${id}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aprobado_por: aprobadoPor, comentarios })
        });
        return response.json();
    },

    getEstadisticas: async (empleadoId?: number) => {
        const url = empleadoId
            ? `${API_BASE_URL}/permisos/estadisticas/${empleadoId}`
            : `${API_BASE_URL}/permisos/estadisticas`;
        const response = await fetch(url);
        return response.json();
    }
};

// Vacaciones
export const vacacionesAPI = {
    solicitar: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/vacaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    getByEmpleado: async (empleadoId: number) => {
        const response = await fetch(`${API_BASE_URL}/vacaciones/empleado/${empleadoId}`);
        return response.json();
    },

    getBalance: async (empleadoId: number, year: number) => {
        const response = await fetch(`${API_BASE_URL}/vacaciones/balance/${empleadoId}/${year}`);
        return response.json();
    },

    getPendientes: async () => {
        const response = await fetch(`${API_BASE_URL}/vacaciones/pendientes`);
        return response.json();
    },

    aprobar: async (id: number, aprobadoPor: number, comentarios?: string) => {
        const response = await fetch(`${API_BASE_URL}/vacaciones/${id}/aprobar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aprobado_por: aprobadoPor, comentarios })
        });
        return response.json();
    },

    rechazar: async (id: number, aprobadoPor: number, comentarios: string) => {
        const response = await fetch(`${API_BASE_URL}/vacaciones/${id}/rechazar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aprobado_por: aprobadoPor, comentarios })
        });
        return response.json();
    }
};

// Incapacidades
export const incapacidadesAPI = {
    create: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/incapacidades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    getByEmpleado: async (empleadoId: number) => {
        const response = await fetch(`${API_BASE_URL}/incapacidades/empleado/${empleadoId}`);
        return response.json();
    },

    getActivas: async () => {
        const response = await fetch(`${API_BASE_URL}/incapacidades/activas`);
        return response.json();
    },

    finalizar: async (id: number) => {
        const response = await fetch(`${API_BASE_URL}/incapacidades/${id}/finalizar`, {
            method: 'PUT'
        });
        return response.json();
    },

    cancelar: async (id: number) => {
        const response = await fetch(`${API_BASE_URL}/incapacidades/${id}/cancelar`, {
            method: 'PUT'
        });
        return response.json();
    },

    update: async (id: number, data: any) => {
        const response = await fetch(`${API_BASE_URL}/incapacidades/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    getEstadisticas: async (empleadoId?: number) => {
        const url = empleadoId
            ? `${API_BASE_URL}/incapacidades/estadisticas/${empleadoId}`
            : `${API_BASE_URL}/incapacidades/estadisticas`;
        const response = await fetch(url);
        return response.json();
    }
};
