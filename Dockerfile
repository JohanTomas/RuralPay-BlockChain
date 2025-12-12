# Etapa de construcción
FROM node:18-alpine AS builder

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación Angular con SSR
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias para producción
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar la aplicación construida desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 4000

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambiar propietario del directorio
RUN chown -R nextjs:nodejs /app
USER nextjs

# Comando para iniciar el servidor
CMD ["node", "dist/pago-rural/server/server.mjs"]
