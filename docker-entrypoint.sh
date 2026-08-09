#!/bin/bash
set -e

# Ensure the SQLite data directory exists and is writable
DATA_DIR=/app/backend/data
mkdir -p "$DATA_DIR"
chmod -R a+rwX "$DATA_DIR" 2>/dev/null || true
if [ ! -w "$DATA_DIR" ]; then
    echo "ERROR: $DATA_DIR is not writable. Please check the data volume permissions." >&2
    exit 1
fi

# Start backend (仅容器内部可达，对外只暴露前端 5173)
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 18001 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
backend_ready=false
for i in $(seq 1 30); do
    if curl -s http://localhost:18001/api/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        backend_ready=true
        break
    fi
    sleep 1
done

if [ "$backend_ready" != "true" ]; then
    echo "Backend failed to start within 30s, exiting." >&2
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start frontend
cd /app/frontend
PORT=5173 HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!

echo "ValidProxy is running!"
echo "  Frontend: http://localhost:5173  (/api 由前端代理到容器内后端，后端不对外暴露)"

# Handle shutdown
shutdown() {
    echo "Shutting down..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    wait $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    exit 0
}

trap shutdown SIGTERM SIGINT

# Wait for any process to exit
wait -n $FRONTEND_PID $BACKEND_PID
