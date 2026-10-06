# ─────────────────────────────────────────────────────────────────
# Stage 1: Dependency Install (leverages Docker layer cache)
# ─────────────────────────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Install only production dependencies for minimal image size
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# ─────────────────────────────────────────────────────────────────
# Stage 2: Production Runtime Image
# ─────────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling (PID 1 safety)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Run as unprivileged node user for security
USER node

# Copy dependencies from cache stage
COPY --chown=node:node --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=node:node . .

# Server port
EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signal forwarding correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
