SHELL := /bin/bash

.PHONY: help install install-client install-server dev stop mongo-up mongo-stop mongo-logs

# ─── Default ─────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  LinguaLocal — available commands"
	@echo ""
	@echo "  make install       Install all dependencies (frontend + backend)"
	@echo "  make dev           Start everything: MongoDB, backend, frontend"
	@echo "  make stop          Stop MongoDB and all background processes"
	@echo "  make mongo-up      Start MongoDB container only"
	@echo "  make mongo-stop    Stop MongoDB container only"
	@echo "  make mongo-logs    Tail MongoDB container logs"
	@echo ""

# ─── Install ─────────────────────────────────────────────────────────────────

install: install-client install-server
	@echo ""
	@echo "  ✓ All dependencies installed"
	@echo ""

install-client:
	@echo "→ Installing frontend dependencies..."
	@cd client && npm install

install-server:
	@echo "→ Downloading Go modules..."
	@cd server && go mod download

# ─── MongoDB ─────────────────────────────────────────────────────────────────

mongo-up:
	@echo "→ Starting MongoDB..."
	@docker compose up -d
	@echo "→ Waiting for MongoDB to be ready..."
	@until docker inspect --format='{{.State.Health.Status}}' lingualocal_mongo 2>/dev/null | grep -q "healthy"; do \
		sleep 1; \
	done
	@echo "  ✓ MongoDB is ready on port 27017"

mongo-stop:
	@echo "→ Stopping MongoDB..."
	@docker compose stop

mongo-logs:
	@docker compose logs -f mongo

# ─── Dev ─────────────────────────────────────────────────────────────────────

dev: mongo-up
	@echo ""
	@echo "  ✓ LinguaLocal dev environment starting"
	@echo "  → Frontend : http://localhost:5173"
	@echo "  → Backend  : http://localhost:3000"
	@echo "  → WebSocket: ws://localhost:3001"
	@echo "  → MongoDB  : mongodb://localhost:27017"
	@echo ""
	@echo "  Press Ctrl+C to stop all services"
	@echo ""
	@trap 'echo ""; echo "  Shutting down..."; docker compose stop; kill 0' INT TERM; \
	(cd client && npm run dev) & \
	(cd server && go run .) & \
	wait

# ─── Stop ────────────────────────────────────────────────────────────────────

stop: mongo-stop
	@echo "→ Killing dev processes..."
	@pkill -f "vite" 2>/dev/null || true
	@pkill -f "go run" 2>/dev/null || true
	@echo "  ✓ All services stopped"
