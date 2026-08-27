import { pool, testConnection } from './connection';
import * as fs from 'fs';
import * as path from 'path';

const migrate = async () => {
    try {
        console.log('🔄 Iniciando migración de base de datos...\n');

        const connected = await testConnection();
        if (!connected) {
            throw new Error('No se pudo conectar a la base de datos');
        }

        const sqlFiles = [
            path.join(__dirname, '../../../database/01_schema.sql'),
            path.join(__dirname, '../../../database/02_organizacion.sql'),
            path.join(__dirname, '../../../database/03_reclutamiento.sql'),
            path.join(__dirname, '../../../database/04_seguridad.sql'),
            path.join(__dirname, '../../../database/05_contratacion.sql'),
            path.join(__dirname, '../../../database/06_auth.sql'),
        ];

        for (const sqlFile of sqlFiles) {
            const sql = fs.readFileSync(sqlFile, 'utf-8');
            if (!sql.trim()) continue;

            console.log(`📝 Ejecutando ${path.basename(sqlFile)}...\n`);
            await pool.query(sql);
        }

        console.log('✅ Migración completada exitosamente!\n');
        console.log('📊 Tablas creadas:');
        console.log('   - empleados');
        console.log('   - biometricos');
        console.log('   - asistencias');
        console.log('   - permisos');
        console.log('   - vacaciones');
        console.log('   - incapacidades');
        console.log('   - usuarios');
        console.log('   - invitaciones');
        console.log('   - reset_password_tokens');
        console.log('   - reset_codigos');
        console.log('   - sesiones');
        console.log('   - catalogos');
        console.log('   - configuracion');
        console.log('   - vacantes');
        console.log('   - aspirantes');
        console.log('   - entrevistas');
        console.log('   - pruebas_aspirante');
        console.log('   - documentos_aspirante\n');

        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        console.log('📋 Tablas en la base de datos:');
        result.rows.forEach((row: any) => {
            console.log(`   ✓ ${row.table_name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    }
};

migrate();
