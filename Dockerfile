# Stage 1: Build frontend
FROM node:22-slim AS frontend-builder

RUN corepack enable
WORKDIR /app

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ .
RUN pnpm build

# Stage 2: Build backend
FROM python:3.13-slim AS backend-builder

WORKDIR /app
RUN pip install --no-cache-dir uv

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv pip install --system --no-cache -r requirements.txt 2>/dev/null || uv pip install --system --no-cache .

COPY backend/ .

# Stage 3: Final image
FROM python:3.13-slim

WORKDIR /app

# Install Node.js for frontend
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY --from=backend-builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend code
COPY backend/ /app/backend/

# Copy frontend standalone build
COPY --from=frontend-builder /app/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/public /app/frontend/public

# Copy startup script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 5173 18001

CMD ["/app/docker-entrypoint.sh"]
