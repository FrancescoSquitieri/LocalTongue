package session

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Repository defines the data-access contract for sessions.
type Repository interface {
	Create(ctx context.Context, s *Session) error
	FindAll(ctx context.Context) ([]Session, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*Session, error)
	Delete(ctx context.Context, id primitive.ObjectID) error
	DeleteAll(ctx context.Context) error
	IncrementMessageCount(ctx context.Context, id primitive.ObjectID) error
}

// Service defines the business-logic contract for sessions.
type Service interface {
	Create(ctx context.Context, req CreateSessionRequest) (*SessionResponse, error)
	GetAll(ctx context.Context) ([]SessionResponse, error)
	GetByID(ctx context.Context, id string) (*SessionWithMessagesResponse, error)
	Delete(ctx context.Context, id string) error
	DeleteAll(ctx context.Context) error
}
