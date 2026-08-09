# Stage 1: Build frontend
FROM node:22-slim AS frontend-builder

WORKDIR /app

RUN corepack enable

COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ .
RUN pnpm build

# Stage 2: Final image
FROM python:3.13-slim

WORKDIR /app

# Install curl (entrypoint health check) + Node.js for the frontend standalone server
RUN apt-get update && apt-get install -y --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install uv for Python package management
RUN pip install --no-cache-dir uv

# Install backend dependencies (runtime only)
COPY backend/requirements.txt ./
RUN uv pip install --system --no-cache -r requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy frontend standalone build
COPY --from=frontend-builder /app/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/public /app/frontend/public

# Copy startup script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# 仅暴露前端端口；后端通过前端服务端的 /api 代理访问，不对外暴露
EXPOSE 5173

CMD ["/app/docker-entrypoint.sh"]
