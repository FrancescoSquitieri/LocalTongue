package message

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Repository defines the data-access contract for messages.
type Repository interface {
	Create(ctx context.Context, msg *Message) error
	FindBySessionID(ctx context.Context, sessionID primitive.ObjectID) ([]Message, error)
	DeleteBySessionID(ctx context.Context, sessionID primitive.ObjectID) error
}
