package session

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Repository defines the data-access contract for sessions.
type Repository interface {
	Create(ctx context.Context, s *Session) error
	FindPaginated(ctx context.Context, filter SessionFilter, page, limit int) ([]Session, int64, error)
	FindDistinctLanguages(ctx context.Context) ([]LanguageOption, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*Session, error)
	Delete(ctx context.Context, id primitive.ObjectID) error
	DeleteAll(ctx context.Context) error
	IncrementMessageCount(ctx context.Context, id primitive.ObjectID) error
}

// Service defines the business-logic contract for sessions.
type Service interface {
	Create(ctx context.Context, req CreateSessionRequest) (*SessionResponse, error)
	GetPaginated(ctx context.Context, filter SessionFilter, page, limit int) (*PaginatedSessionsResponse, error)
	GetLanguages(ctx context.Context) ([]LanguageOption, error)
	GetByID(ctx context.Context, id string) (*SessionWithMessagesResponse, error)
	Delete(ctx context.Context, id string) error
	DeleteAll(ctx context.Context) error
}
