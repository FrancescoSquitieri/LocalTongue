package message

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Message is the BSON/DB representation of a conversation message.
type Message struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"-"`
	SessionID primitive.ObjectID `bson:"sessionId"     json:"-"`
	Role      string             `bson:"role"          json:"role"`
	Content   string             `bson:"content"       json:"content"`
	CreatedAt time.Time          `bson:"createdAt"     json:"createdAt"`
}

// MessageResponse is the JSON-safe DTO returned to clients.
type MessageResponse struct {
	ID        string    `json:"id"`
	SessionID string    `json:"sessionId"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

// ToResponse converts a Message to its client-facing DTO.
func (m *Message) ToResponse() MessageResponse {
	return MessageResponse{
		ID:        m.ID.Hex(),
		SessionID: m.SessionID.Hex(),
		Role:      m.Role,
		Content:   m.Content,
		CreatedAt: m.CreatedAt,
	}
}
