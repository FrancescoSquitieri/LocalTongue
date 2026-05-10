package session

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"local_tongue/message"
)

// Session is the BSON/DB representation of a learning session.
type Session struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"-"`
	Language     string             `bson:"language"      json:"language"`
	LanguageCode string             `bson:"languageCode"  json:"languageCode"`
	Level        string             `bson:"level"         json:"level"`
	Topic        string             `bson:"topic"         json:"topic"`
	Title        string             `bson:"title"         json:"title"`
	CreatedAt    time.Time          `bson:"createdAt"     json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt"     json:"updatedAt"`
	MessageCount int                `bson:"messageCount"  json:"messageCount"`
}

// SessionResponse is the JSON-safe DTO returned to clients.
type SessionResponse struct {
	ID           string    `json:"id"`
	Language     string    `json:"language"`
	LanguageCode string    `json:"languageCode"`
	Level        string    `json:"level"`
	Topic        string    `json:"topic"`
	Title        string    `json:"title"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	MessageCount int       `json:"messageCount"`
}

// ToResponse converts a Session to its client-facing DTO.
func (s *Session) ToResponse() SessionResponse {
	return SessionResponse{
		ID:           s.ID.Hex(),
		Language:     s.Language,
		LanguageCode: s.LanguageCode,
		Level:        s.Level,
		Topic:        s.Topic,
		Title:        s.Title,
		CreatedAt:    s.CreatedAt,
		UpdatedAt:    s.UpdatedAt,
		MessageCount: s.MessageCount,
	}
}

// CreateSessionRequest is the body expected on POST /sessions.
type CreateSessionRequest struct {
	Language     string `json:"language"`
	LanguageCode string `json:"languageCode"`
	Level        string `json:"level"`
	Topic        string `json:"topic"`
}

// SessionWithMessagesResponse is the body returned on GET /sessions/{id}.
type SessionWithMessagesResponse struct {
	Session  SessionResponse           `json:"session"`
	Messages []message.MessageResponse `json:"messages"`
}
