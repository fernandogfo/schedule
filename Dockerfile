# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cache-friendly layer)
COPY package.json package-lock.json ./
RUN npm ci

# Standalone build (uses pre-generated static voice clips in public/assets/audio/voice/)
# Optional VITE_VOICE_URL can still be passed if an external voice server is desired
ARG VITE_VOICE_URL=""
ENV VITE_VOICE_URL=${VITE_VOICE_URL}

COPY . .
RUN npm run build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Replace default nginx config with our SPA-friendly one
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
