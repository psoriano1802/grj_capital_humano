const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

async function fixPasswords() {
    const password = process.argv[2] || 'Admin123!';

    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'rh_management',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    console.log(`Generando hash para: ${password}`);

    const hash = await bcrypt.hash(password, 12);
    console.log(`Hash generado: ${hash}`);

    const result = await pool.query(
        'UPDATE usuarios SET password_hash = $1 WHERE activo = true RETURNING id, email',
        [hash]
    );

    console.log(`Usuarios actualizados: ${result.rowCount}`);
    result.rows.forEach(r => console.log(`  - ${r.email}`));

    await pool.end();
    console.log('Listo!');
}

fixPasswords().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
