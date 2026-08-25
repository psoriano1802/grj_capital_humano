import { pool } from '../database/connection';
import { Empleado, CreateEmpleadoDTO, ApiResponse } from '../types';

export class EmpleadoService {
    // Obtener todos los empleados
    async getAllEmpleados(): Promise<Empleado[]> {
        const query = `
      SELECT e.*,
             p.clave AS perfil_clave,
             p.nombre AS perfil_nombre,
             p.es_administrador AS perfil_admin
      FROM empleados e
      LEFT JOIN perfiles p ON p.id = e.perfil_id
      WHERE e.estatus = 'activo'
      ORDER BY e.apellido_paterno, e.nombre
    `;
        const result = await pool.query(query);
        return result.rows;
    }

    // Obtener empleado por ID
    async getEmpleadoById(id: number): Promise<Empleado | null> {
        const query = 'SELECT * FROM empleados WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }

    // Obtener empleado por número de empleado
    async getEmpleadoByNumero(numero: string): Promise<Empleado | null> {
        const query = 'SELECT * FROM empleados WHERE numero_empleado = $1';
        const result = await pool.query(query, [numero]);
        return result.rows[0] || null;
    }

    // Crear nuevo empleado
    async createEmpleado(data: CreateEmpleadoDTO): Promise<Empleado> {
        const query = `
      INSERT INTO empleados (
        numero_empleado, nombre, apellido_paterno, apellido_materno,
        email, telefono, fecha_nacimiento, fecha_ingreso,
        puesto, departamento, salario,
        tipo_contratacion, tipo_empleado, tipo_jornada, turno,
        horario_laboral, esquema_pago, tipo_contrato
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
        const values = [
            data.numero_empleado,
            data.nombre,
            data.apellido_paterno,
            data.apellido_materno,
            data.email,
            data.telefono,
            data.fecha_nacimiento,
            data.fecha_ingreso,
            data.puesto,
            data.departamento,
            data.salario,
            data.tipo_contratacion,
            data.tipo_empleado,
            data.tipo_jornada,
            data.turno,
            data.horario_laboral,
            data.esquema_pago,
            data.tipo_contrato
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Actualizar empleado (solo columnas permitidas)
    async updateEmpleado(id: number, data: Partial<CreateEmpleadoDTO>): Promise<Empleado> {
        const permitidos = [
            'numero_empleado', 'nombre', 'apellido_paterno', 'apellido_materno',
            'email', 'telefono', 'fecha_nacimiento', 'fecha_ingreso',
            'puesto', 'departamento', 'salario',
            'tipo_contrato', 'tipo_contratacion', 'tipo_empleado', 'tipo_jornada',
            'turno', 'horario_laboral', 'esquema_pago'
        ] as const;

        const fields: string[] = [];
        const values: any[] = [];

        for (const key of permitidos) {
            if (data[key] !== undefined) {
                fields.push(`${key} = $${values.length + 1}`);
                values.push(data[key]);
            }
        }

        if (fields.length === 0) {
            const cur = await this.getEmpleadoById(id);
            if (!cur) throw new Error('Empleado no encontrado');
            return cur;
        }

        values.push(id);
        const query = `
      UPDATE empleados 
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

        const result = await pool.query(query, values);
        if (result.rows.length === 0) throw new Error('Empleado no encontrado');
        return result.rows[0];
    }

    // Generar numero de empleado unico
    private async generarNumero(): Promise<string> {
        const base = `EMP${new Date().getFullYear()}-`;
        const conteo = await pool.query('SELECT COUNT(*)::int AS n FROM empleados');
        const intento1 = `${base}${String(conteo.rows[0].n + 1).padStart(4, '0')}`;
        const existe = await pool.query('SELECT 1 FROM empleados WHERE numero_empleado = $1', [intento1]);
        if (existe.rows.length > 0) {
            // Anexar sufijo aleatorio si choca
            return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
        }
        return intento1;
    }

    // Crear empleado a partir de un aspirante aprobado (traspaso de datos al modulo de empleados)
    async crearEmpleadoDesdeAspirante(aspiranteId: number): Promise<any> {
        const asp = await pool.query(
            `SELECT a.*, v.titulo AS vacante_titulo, v.departamento AS vacante_departamento
             FROM aspirantes a
             LEFT JOIN vacantes v ON a.vacante_id = v.id
             WHERE a.id = $1`,
            [aspiranteId]
        );
        if (asp.rows.length === 0) throw new Error('Aspirante no encontrado');
        const aspirante = asp.rows[0];

        // Idempotente: si ya se contrato, devolver el empleado existente
        if (aspirante.empleado_id) {
            const existente = await this.getEmpleadoById(aspirante.empleado_id);
            if (existente) return { empleado: existente, ya_existia: true };
        }

        if (aspirante.estatus !== 'APROBADO') {
            throw new Error('Solo se puede contratar a un aspirante aprobado');
        }

        // Evitar duplicado por correo
        const dupEmail = await pool.query('SELECT id FROM empleados WHERE LOWER(email) = LOWER($1)', [aspirante.email]);
        if (dupEmail.rows.length > 0) {
            throw new Error('Ya existe un empleado con el correo de este aspirante');
        }

        const numero = await this.generarNumero();
        const hoy = new Date().toISOString().split('T')[0];

        const r = await pool.query(
            `INSERT INTO empleados (
                numero_empleado, nombre, apellido_paterno, apellido_materno,
                email, telefono, fecha_nacimiento, fecha_ingreso,
                puesto, departamento, salario
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING *`,
            [
                numero, aspirante.nombre, aspirante.apellido_paterno, aspirante.apellido_materno,
                aspirante.email, aspirante.telefono, aspirante.fecha_nacimiento, hoy,
                aspirante.vacante_titulo, aspirante.vacante_departamento, aspirante.salario_pretendido,
            ]
        );
        const empleado = r.rows[0];

        // Vincular aspirante al empleado y marcarlo como contratado
        await pool.query(
            `UPDATE aspirantes SET empleado_id = $1, estatus = 'CONTRATADO', etapa_actual = 'CONTRATACION' WHERE id = $2`,
            [empleado.id, aspiranteId]
        );

        return { empleado, ya_existia: false };
    }

    // Desactivar empleado
    async deactivateEmpleado(id: number): Promise<void> {
        const query = 'UPDATE empleados SET estatus = $1 WHERE id = $2';
        await pool.query(query, ['inactivo', id]);
    }

    // Buscar empleados
    async searchEmpleados(searchTerm: string): Promise<Empleado[]> {
        const query = `
      SELECT * FROM empleados 
      WHERE (
        LOWER(nombre) LIKE LOWER($1) OR
        LOWER(apellido_paterno) LIKE LOWER($1) OR
        LOWER(apellido_materno) LIKE LOWER($1) OR
        numero_empleado LIKE $1 OR
        email LIKE LOWER($1)
      ) AND estatus = 'activo'
      ORDER BY apellido_paterno, nombre
    `;
        const result = await pool.query(query, [`%${searchTerm}%`]);
        return result.rows;
    }

    // Obtener empleados por departamento
    async getEmpleadosByDepartamento(departamento: string): Promise<Empleado[]> {
        const query = `
      SELECT * FROM empleados 
      WHERE departamento = $1 AND estatus = 'activo'
      ORDER BY apellido_paterno, nombre
    `;
        const result = await pool.query(query, [departamento]);
        return result.rows;
    }
}

export default new EmpleadoService();
