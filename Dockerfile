# ============================================
# Glassypage — Dockerfile
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Create plugins directory (persisted via volume)
RUN mkdir -p plugins

# Drop to non-root user
RUN addgroup -S glassy && adduser -S glassy -G glassy \
    && chown -R glassy:glassy /app
USER glassy

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
