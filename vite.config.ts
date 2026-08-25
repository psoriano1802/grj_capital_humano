import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: ['empty-readers-wink.lt.desplega.ai'], // Pega aquí TU URL exacta
        port: 5173,
        proxy: {

            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/uploads': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist/client'
    }
});
