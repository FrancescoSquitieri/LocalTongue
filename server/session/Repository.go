package session

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

// NewRepository returns a MongoDB-backed Repository for sessions.
func NewRepository(collection *mongo.Collection) Repository {
	return &mongoRepository{collection: collection}
}

func (r *mongoRepository) Create(ctx context.Context, s *Session) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	result, err := r.collection.InsertOne(ctx, s)
	if err != nil {
		return fmt.Errorf("session: create: %w", err)
	}

	s.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *mongoRepository) FindAll(ctx context.Context) ([]Session, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, fmt.Errorf("session: find all: %w", err)
	}
	defer cursor.Close(ctx)

	var sessions []Session
	if err := cursor.All(ctx, &sessions); err != nil {
		return nil, fmt.Errorf("session: decode sessions: %w", err)
	}

	return sessions, nil
}

func (r *mongoRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*Session, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	var s Session
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&s)
	if err == mongo.ErrNoDocuments {
		return nil, fmt.Errorf("session: not found")
	}
	if err != nil {
		return nil, fmt.Errorf("session: find by id: %w", err)
	}

	return &s, nil
}

func (r *mongoRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	if _, err := r.collection.DeleteOne(ctx, bson.M{"_id": id}); err != nil {
		return fmt.Errorf("session: delete: %w", err)
	}

	return nil
}

func (r *mongoRepository) IncrementMessageCount(ctx context.Context, id primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	filter := bson.M{"_id": id}
	update := bson.M{
		"$inc": bson.M{"messageCount": 1},
		"$set": bson.M{"updatedAt": time.Now()},
	}

	if _, err := r.collection.UpdateOne(ctx, filter, update); err != nil {
		return fmt.Errorf("session: increment message count: %w", err)
	}

	return nil
}
