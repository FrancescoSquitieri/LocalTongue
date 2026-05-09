package websocket

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"

	"local_tongue/lmstudio"
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

// Handler upgrades the HTTP connection to WebSocket and manages a per-connection
// conversation history, forwarding user messages to LM Studio and streaming replies back.
func Handler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket: upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("websocket: client connected from %s", r.RemoteAddr)

	var history []lmstudio.ChatMessage

loop:
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

		switch msg.Type {
		case "user_message":
			userText, ok := msg.Payload.(string)
			if !ok {
				log.Printf("websocket: user_message payload is not a string (got %T)", msg.Payload)
				sendError(conn, "Could not get a response. Please try again.")
				continue
			}

			log.Printf("websocket: received user_message: %q", userText)

			response, err := lmstudio.Complete(history, userText)
			if err != nil {
				log.Printf("websocket: lmstudio error: %v", err)
				sendError(conn, "Could not get a response. Please try again.")
				continue
			}

			history = append(history,
				lmstudio.ChatMessage{Role: "user", Content: userText},
				lmstudio.ChatMessage{Role: "assistant", Content: response},
			)

			if err := conn.WriteJSON(Message{Type: "agent_response", Payload: response}); err != nil {
				log.Printf("websocket: write error: %v", err)
				break loop
			}

		default:
			log.Printf("websocket: unknown message type %q — skipping", msg.Type)
		}
	}

	log.Printf("websocket: client disconnected from %s", r.RemoteAddr)
}

// sendError writes an error message to the WebSocket connection.
func sendError(conn *websocket.Conn, message string) {
	if err := conn.WriteJSON(Message{Type: "error", Payload: message}); err != nil {
		log.Printf("websocket: failed to send error message: %v", err)
	}
}
