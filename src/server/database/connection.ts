import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'rh_management',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Manejar errores de conexión
pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
    process.exit(-1);
});

// Función para verificar la conexión
export const testConnection = async (): Promise<boolean> => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con PostgreSQL:', error);
        return false;
    }
};

// Función para ejecutar queries
export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Error en query:', { text, error });
        throw error;
    }
};

export default pool;
