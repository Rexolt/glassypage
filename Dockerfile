# ============================================
# Glassypage — Dockerfile
# Distro-agnostic image (runs on any Docker host: Debian, Arch, …)
# ============================================
FROM node:20-alpine

# Runtime packages:
#   docker-cli      → lets the built-in Docker widget talk to a mounted
#                     /var/run/docker.sock (manage host containers from the UI)
#   tzdata          → correct local time for the clock/uptime via the TZ env var
#   ca-certificates → TLS for weather / RSS / currency fetches
#   wget            → used by HEALTHCHECK (busybox build, kept explicit)
RUN apk add --no-cache docker-cli tzdata ca-certificates wget

WORKDIR /app

# Install dependencies first (separate layer for better build caching)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY . .

# Plugins live in a volume; create the dir and a non-root user that owns /app.
RUN mkdir -p plugins \
    && addgroup -S glassy && adduser -S glassy -G glassy \
    && chown -R glassy:glassy /app

# Secure default. docker-compose overrides this with the host UID/GID so
# bind-mounted files (config.json, plugins/) stay writable — see .env.example.
USER glassy

ENV NODE_ENV=production \
    PORT=3000 \
    TZ=UTC

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT}/api/health" >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
