package quiz

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"local_tongue/message"
	"local_tongue/session"
)

// Repository defines the data-access contract for quizzes.
type Repository interface {
	Create(ctx context.Context, q *Quiz) error
	FindPaginated(ctx context.Context, filter QuizFilter, page, limit int) ([]Quiz, int64, error)
	FindDistinctLanguages(ctx context.Context) ([]LanguageOption, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*Quiz, error)
	Delete(ctx context.Context, id primitive.ObjectID) error
	DeleteAll(ctx context.Context) error
}

// Service defines the business-logic contract for quizzes.
type Service interface {
	Generate(ctx context.Context, req GenerateQuizRequest, messageRepo message.Repository, sessionRepo session.Repository) (*QuizResponse, error)
	GetPaginated(ctx context.Context, filter QuizFilter, page, limit int) (*PaginatedQuizzesResponse, error)
	GetLanguages(ctx context.Context) ([]LanguageOption, error)
	GetByID(ctx context.Context, id string) (*QuizResponse, error)
	Delete(ctx context.Context, id string) error
	DeleteAll(ctx context.Context) error
}
