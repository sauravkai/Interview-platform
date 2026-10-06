# ─────────────────────────────────────────────────────────────────
# Stage 1: Build Vite React App
# ─────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .

# Pass build-time environment variables
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Serve via High-Performance Nginx
# ─────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy production Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React SPA
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check for Nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/api/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
