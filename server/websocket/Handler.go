package websocket

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// Message represents a JSON message exchanged over the WebSocket connection.
type Message struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

var upgrader = websocket.Upgrader{
	// Allow all origins during development.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Handler upgrades the HTTP connection to WebSocket and echoes every message back.
func Handler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket: upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("websocket: client connected from %s", r.RemoteAddr)

	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			log.Printf("websocket: read error: %v", err)
			break
		}

		var msg Message
		if err := json.Unmarshal(raw, &msg); err != nil {
			log.Printf("websocket: malformed message: %v", err)
			continue
		}

		if err := conn.WriteJSON(msg); err != nil {
			log.Printf("websocket: write error: %v", err)
			break
		}
	}

	log.Printf("websocket: client disconnected from %s", r.RemoteAddr)
}
