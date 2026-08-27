import "dotenv/config";
import { pool } from "./src/server/database/connection";
import AuthService from "./src/server/services/authService";

(async () => {
    try {
        const result = await pool.query(`
            SELECT e.id, e.numero_empleado, e.nombre, e.apellido_paterno, e.email
            FROM empleados e
            LEFT JOIN usuarios u ON u.empleado_id = e.id
            WHERE e.estatus = 'activo'
              AND e.email IS NOT NULL
              AND u.id IS NULL
            ORDER BY e.apellido_paterno, e.nombre
        `);

        const empleados = result.rows;
        console.log(`📋 Empleados sin cuenta de usuario: ${empleados.length}`);

        if (empleados.length === 0) {
            console.log('✅ Todos los empleados ya tienen cuenta.');
            await pool.end();
            process.exit(0);
        }

        console.log('\nEmpleados a procesar:');
        empleados.forEach((emp: any) => {
            console.log(`  - ${emp.numero_empleado}: ${emp.nombre} ${emp.apellido_paterno} (${emp.email})`);
        });

        const adminResult = await pool.query(`
            SELECT id FROM empleados
            WHERE numero_empleado = 'EMP002'
            LIMIT 1
        `);
        const adminId = adminResult.rows[0]?.id || 1;

        const confirm = process.argv.includes('--confirm');
        if (!confirm) {
            console.log('\n⚠️  Modo simulación. Añade --confirm para ejecutar realmente.');
            console.log('  Ejemplo: npx ts-node --project tsconfig.server.json scripts/migrateUsers.ts --confirm\n');
        }

        let success = 0;
        let failed = 0;

        for (const emp of empleados) {
            if (!confirm) continue;

            try {
                const res = await AuthService.createInvitation(emp.email, adminId);
                if (res.success) {
                    console.log(`  ✅ Invitación enviada a ${emp.email}`);
                    success++;
                } else {
                    console.log(`  ❌ ${emp.email}: ${res.error}`);
                    failed++;
                }
            } catch (e: any) {
                console.log(`  ❌ ${emp.email}: ${e.message}`);
                failed++;
            }

            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`\n📊 Resultados: ${success} enviados, ${failed} errores`);
        await pool.end();
        process.exit(failed > 0 ? 1 : 0);
    } catch (e: any) {
        console.error('❌ Error:', e.message);
        await pool.end();
        process.exit(1);
    }
})();
