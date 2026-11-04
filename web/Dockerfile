# syntax=docker/dockerfile:1

# Etapa 1: Build de la SPA con Node 24 LTS
FROM node:24-bookworm-slim AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

# Etapa 2: Servidor web con Nginx Alpine
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
