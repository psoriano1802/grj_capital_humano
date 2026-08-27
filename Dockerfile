# Dockerfile
# Etapa 1: Compilación de Frontend y Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar todas las dependencias
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Compilar TypeScript (Backend) y Vite (Frontend)
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine AS production

WORKDIR /app

# Instalar solo las dependencias de producción para mantener la imagen ligera y segura
COPY package*.json ./
RUN npm ci --only=production

# Copiar archivos estáticos compilados de React
COPY --from=builder /app/dist ./dist

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Exponer el puerto
EXPOSE 3000

# El código original en .ts y los archivos de React (src/) NO se incluyen en esta capa.
# Solo se incluye la carpeta transpilada `dist`.
CMD ["node", "dist/index.js"]
