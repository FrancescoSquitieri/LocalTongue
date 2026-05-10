package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"local_tongue/lmstudio"
	"local_tongue/message"
	"local_tongue/session"
)

// Message represents a JSON message exchanged over the WebSocket connection.
type Message struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// sessionState holds the mutable per-session context inside a WebSocket connection.
type sessionState struct {
	objectID primitive.ObjectID
	idStr    string
	config   lmstudio.SessionConfig
	history  []lmstudio.ChatMessage
}

// NewHandler returns an http.HandlerFunc that manages a session-aware WebSocket connection.
// The first message must be init_session. Subsequent init_session messages are also accepted
// to allow switching or restarting a session on the same connection.
func NewHandler(sessionRepo session.Repository, messageRepo message.Repository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("websocket: upgrade error: %v", err)
			return
		}
		defer conn.Close()

		log.Printf("websocket: client connected from %s", r.RemoteAddr)

		// resolveSession loads a session and its history from DB given an init_session payload.
		resolveSession := func(payload any) (*sessionState, bool) {
			payloadMap, ok := payload.(map[string]interface{})
			if !ok {
				sendError(conn, "Invalid init_session payload.")
				return nil, false
			}

			sessionIDStr, ok := payloadMap["sessionId"].(string)
			if !ok || sessionIDStr == "" {
				sendError(conn, "Missing sessionId in init_session payload.")
				return nil, false
			}

			sessionObjectID, err := primitive.ObjectIDFromHex(sessionIDStr)
			if err != nil {
				sendError(conn, "Invalid sessionId format.")
				return nil, false
			}

			loadedSession, err := sessionRepo.FindByID(context.Background(), sessionObjectID)
			if err != nil {
				log.Printf("websocket: session not found: %v", err)
				sendError(conn, "Session not found.")
				return nil, false
			}

			existingMessages, err := messageRepo.FindBySessionID(context.Background(), sessionObjectID)
			if err != nil {
				log.Printf("websocket: load messages error: %v", err)
				sendError(conn, "Could not load session messages.")
				return nil, false
			}

			history := make([]lmstudio.ChatMessage, len(existingMessages))
			for i, msg := range existingMessages {
				history[i] = lmstudio.ChatMessage{Role: msg.Role, Content: msg.Content}
			}

			return &sessionState{
				objectID: sessionObjectID,
				idStr:    sessionIDStr,
				config: lmstudio.SessionConfig{
					Language: loadedSession.Language,
					Level:    loadedSession.Level,
					Topic:    loadedSession.Topic,
				},
				history: history,
			}, true
		}

		// ── Step 1: wait for the first init_session ───────────────────────────
		_, raw, err := conn.ReadMessage()
		if err != nil {
			log.Printf("websocket: read init message error: %v", err)
			return
		}

		var initMsg Message
		if err := json.Unmarshal(raw, &initMsg); err != nil || initMsg.Type != "init_session" {
			log.Printf("websocket: expected init_session, got %q", initMsg.Type)
			sendError(conn, "Expected init_session as first message.")
			return
		}

		state, ok := resolveSession(initMsg.Payload)
		if !ok {
			return
		}

		if err := conn.WriteJSON(Message{
			Type:    "session_ready",
			Payload: map[string]string{"sessionId": state.idStr},
		}); err != nil {
			log.Printf("websocket: write session_ready error: %v", err)
			return
		}

		log.Printf("websocket: session %s ready (%d prior messages)", state.idStr, len(state.history))

		// ── Step 2: message loop ──────────────────────────────────────────────
	loop:
		for {
			_, msgRaw, err := conn.ReadMessage()
			if err != nil {
				log.Printf("websocket: read error: %v", err)
				break
			}

			var msg Message
			if err := json.Unmarshal(msgRaw, &msg); err != nil {
				log.Printf("websocket: malformed message: %v", err)
				continue
			}

			switch msg.Type {

			// A new init_session mid-connection means the user started a new session
			// without reconnecting. Re-resolve and acknowledge the new session.
			case "init_session":
				newState, ok := resolveSession(msg.Payload)
				if !ok {
					continue
				}
				state = newState

				if err := conn.WriteJSON(Message{
					Type:    "session_ready",
					Payload: map[string]string{"sessionId": state.idStr},
				}); err != nil {
					log.Printf("websocket: write session_ready error: %v", err)
					break loop
				}

				log.Printf("websocket: re-initialized session %s (%d prior messages)", state.idStr, len(state.history))

			case "user_message":
				userText, ok := msg.Payload.(string)
				if !ok {
					sendError(conn, "Could not get a response. Please try again.")
					continue
				}

				response, err := lmstudio.Complete(state.config, state.history, userText)
				if err != nil {
					log.Printf("websocket: lmstudio error: %v", err)
					sendError(conn, "Could not get a response. Please try again.")
					continue
				}

				userMsg := &message.Message{
					SessionID: state.objectID,
					Role:      "user",
					Content:   userText,
					CreatedAt: time.Now(),
				}
				if err := messageRepo.Create(context.Background(), userMsg); err != nil {
					log.Printf("websocket: save user message error: %v", err)
				}

				assistantMsg := &message.Message{
					SessionID: state.objectID,
					Role:      "assistant",
					Content:   response,
					CreatedAt: time.Now(),
				}
				if err := messageRepo.Create(context.Background(), assistantMsg); err != nil {
					log.Printf("websocket: save assistant message error: %v", err)
				}

				if err := sessionRepo.IncrementMessageCount(context.Background(), state.objectID); err != nil {
					log.Printf("websocket: increment message count error: %v", err)
				}

				state.history = append(state.history,
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
}

func sendError(conn *websocket.Conn, msg string) {
	if err := conn.WriteJSON(Message{Type: "error", Payload: msg}); err != nil {
		log.Printf("websocket: failed to send error message: %v", err)
	}
}
