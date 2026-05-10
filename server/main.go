package main

import (
	"encoding/json"
	"log"
	"net/http"

	"local_tongue/database"
	"local_tongue/message"
	"local_tongue/quiz"
	"local_tongue/session"
	wshandler "local_tongue/websocket"
)

func main() {
	// ── MongoDB ───────────────────────────────────────────────────────────────
	if err := database.Connect(); err != nil {
		log.Fatalf("failed to connect to MongoDB: %v", err)
	}

	// ── Repositories ──────────────────────────────────────────────────────────
	messageRepo := message.NewRepository(database.GetCollection("messages"))
	sessionRepo := session.NewRepository(database.GetCollection("sessions"))
	quizRepo := quiz.NewRepository(database.GetCollection("quizzes"))

	// ── Services ──────────────────────────────────────────────────────────────
	sessionService := session.NewService(sessionRepo, messageRepo)
	quizService := quiz.NewService(quizRepo)

	// ── Handlers ──────────────────────────────────────────────────────────────
	sessionHandler := session.NewHandler(sessionService)
	quizHandler := quiz.NewHandler(quizService, messageRepo, sessionRepo)

	// ── HTTP mux ──────────────────────────────────────────────────────────────
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	mux.HandleFunc("POST /sessions", sessionHandler.Create)
	mux.HandleFunc("GET /sessions", sessionHandler.GetAll)
	mux.HandleFunc("GET /sessions/{id}", sessionHandler.GetByID)
	mux.HandleFunc("DELETE /sessions/{id}", sessionHandler.Delete)

	mux.HandleFunc("POST /quizzes", quizHandler.Generate)
	mux.HandleFunc("GET /quizzes", quizHandler.GetAll)
	mux.HandleFunc("GET /quizzes/{id}", quizHandler.GetByID)
	mux.HandleFunc("DELETE /quizzes/{id}", quizHandler.Delete)

	go func() {
		log.Println("HTTP server listening on :3000")
		if err := http.ListenAndServe(":3000", withCORS(mux)); err != nil {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// ── WebSocket server ──────────────────────────────────────────────────────
	wsMux := http.NewServeMux()
	wsMux.HandleFunc("/ws", wshandler.NewHandler(sessionRepo, messageRepo))

	log.Println("WebSocket server listening on :3001")
	if err := http.ListenAndServe(":3001", wsMux); err != nil {
		log.Fatalf("WebSocket server error: %v", err)
	}
}

// withCORS wraps a handler to add CORS headers and handle OPTIONS preflight requests.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
