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
	FindAll(ctx context.Context) ([]Quiz, error)
	FindByID(ctx context.Context, id primitive.ObjectID) (*Quiz, error)
	Delete(ctx context.Context, id primitive.ObjectID) error
}

// Service defines the business-logic contract for quizzes.
type Service interface {
	Generate(ctx context.Context, req GenerateQuizRequest, messageRepo message.Repository, sessionRepo session.Repository) (*QuizResponse, error)
	GetAll(ctx context.Context) ([]QuizResponse, error)
	GetByID(ctx context.Context, id string) (*QuizResponse, error)
	Delete(ctx context.Context, id string) error
}
