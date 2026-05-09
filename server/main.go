package main

import (
	"fmt"
	"log"
	"net/http"

	wshandler "local_tongue/websocket"
)

func main() {
	// HTTP API server — porta 3000
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprintln(w, `{"status":"ok"}`)
		})

		log.Println("HTTP server listening on :3000")
		if err := http.ListenAndServe(":3000", mux); err != nil {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// WebSocket server — porta 3001
	wsMux := http.NewServeMux()
	wsMux.HandleFunc("/ws", wshandler.Handler)

	log.Println("WebSocket server listening on :3001")
	if err := http.ListenAndServe(":3001", wsMux); err != nil {
		log.Fatalf("WebSocket server error: %v", err)
	}
}
