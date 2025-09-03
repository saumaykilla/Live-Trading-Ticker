#!/bin/bash

set -e

echo "🚀 Starting Project Pluto - Fullstack Application"

# Default ports
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    echo "Install with: npm install -g pnpm"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install --recursive

echo "🔧 Generating ConnectRPC code..."
buf generate

cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    [[ ! -z "$BACKEND_PID" ]] && kill -0 $BACKEND_PID 2>/dev/null && kill $BACKEND_PID && echo "✅ Backend stopped"
    [[ ! -z "$FRONTEND_PID" ]] && kill -0 $FRONTEND_PID 2>/dev/null && kill $FRONTEND_PID && echo "✅ Frontend stopped"
    echo "✅ All servers stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend server..."
cd backend
pnpm dev &
BACKEND_PID=$!
cd ..

if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Exiting."
    cleanup
fi

# Start frontend
echo "🌐 Starting frontend server..."
cd frontend
pnpm dev &
FRONTEND_PID=$!
cd ..

sleep 5
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Exiting."
    cleanup
fi

# Dynamically detect host
HOST=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo ""
echo "✅ Application started successfully!"
echo "📊 Backend: http://$HOST:$BACKEND_PORT"
echo "🌐 Frontend: http://$HOST:$FRONTEND_PORT"
echo ""
echo "Press Ctrl+C to stop all servers"

wait
