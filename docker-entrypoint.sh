#!/bin/bash
set -e

# Start backend
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 18001 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 30); do
    if curl -s http://localhost:18001/api/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 1
done

# Start frontend
cd /app/frontend
PORT=5173 HOSTNAME=0.0.0.0 node server.js &
FRONTEND_PID=$!

echo "ValidProxy is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:18001"

# Handle shutdown
shutdown() {
    echo "Shutting down..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit 0
}

trap shutdown SIGTERM SIGINT

# Wait for any process to exit
wait -n $FRONTEND_PID $BACKEND_PID
