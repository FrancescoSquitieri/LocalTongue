package message

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const operationTimeout = 10 * time.Second

type mongoRepository struct {
	collection *mongo.Collection
}

// NewRepository returns a MongoDB-backed Repository for messages.
func NewRepository(collection *mongo.Collection) Repository {
	return &mongoRepository{collection: collection}
}

func (r *mongoRepository) Create(ctx context.Context, msg *Message) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	result, err := r.collection.InsertOne(ctx, msg)
	if err != nil {
		return fmt.Errorf("message: create: %w", err)
	}

	msg.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *mongoRepository) FindBySessionID(ctx context.Context, sessionID primitive.ObjectID) ([]Message, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	filter := bson.M{"sessionId": sessionID}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: 1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("message: find by session id: %w", err)
	}
	defer cursor.Close(ctx)

	var messages []Message
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, fmt.Errorf("message: decode messages: %w", err)
	}

	return messages, nil
}

func (r *mongoRepository) DeleteBySessionID(ctx context.Context, sessionID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	filter := bson.M{"sessionId": sessionID}
	if _, err := r.collection.DeleteMany(ctx, filter); err != nil {
		return fmt.Errorf("message: delete by session id: %w", err)
	}

	return nil
}

func (r *mongoRepository) DeleteAll(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	if _, err := r.collection.DeleteMany(ctx, bson.M{}); err != nil {
		return fmt.Errorf("message: delete all: %w", err)
	}

	return nil
}
