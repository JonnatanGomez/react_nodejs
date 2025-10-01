FROM node:20 as builder
WORKDIR /app
# Copia archivos de configuración
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
# --- FASE DE PRODUCCIÓN (NGINX) ---
FROM nginx:alpine as production
# Copia configuración de Nginx (asumiendo que está en la misma carpeta)
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
# Copia solo los archivos estáticos generados
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
