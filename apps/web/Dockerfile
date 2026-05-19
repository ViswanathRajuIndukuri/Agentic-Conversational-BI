# syntax=docker/dockerfile:1.7
# Multi-stage build for the Vite + React frontend.
# Build context: apps/web (see docker-compose.yml).

# ─────────────────────────────────────────────────────────────
# Stage 1: build the static bundle
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

ENV NODE_ENV=production \
    CI=true

# Install deps in their own layer for caching.
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# Supabase (baked into the static bundle at build time).
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_PUBLISHABLE_KEY=
ARG VITE_SUPABASE_ANON_KEY=
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy sources and build. Vite emits /app/dist.
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2: nginx serves the static bundle + proxies /api to the API
# ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Replace the default site with ours.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

# nginx:alpine already runs as non-root for worker processes; keep master as
# root so it can bind :80 inside the container.

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
