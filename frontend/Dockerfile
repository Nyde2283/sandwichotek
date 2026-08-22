#### BUILDER ####
FROM node:20-alpine AS builder

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci

# Compilation Vite
COPY . .
RUN npm run build

#### FINAL IMAGE ####

FROM nginx:alpine-slim

ENV PORT=80
ENV API_URL=http://localhost
ENV API_PORT=8080

#ENV NGINX_ENVSUBST_FILTER="PORT"

# Copie des fichiers compilés
COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen __PORT__; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf.template

CMD ["/bin/sh", "-c", "echo \"window.env = { API_URL: '${API_URL}', API_PORT: '${API_PORT}' };\" > /usr/share/nginx/html/config.js && sed \"s/__PORT__/${PORT}/g\" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
