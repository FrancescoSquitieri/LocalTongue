package quiz

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

// NewRepository returns a MongoDB-backed Repository for quizzes.
func NewRepository(collection *mongo.Collection) Repository {
	return &mongoRepository{collection: collection}
}

func (r *mongoRepository) Create(ctx context.Context, q *Quiz) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	result, err := r.collection.InsertOne(ctx, q)
	if err != nil {
		return fmt.Errorf("quiz: create: %w", err)
	}

	q.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *mongoRepository) FindAll(ctx context.Context) ([]Quiz, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, fmt.Errorf("quiz: find all: %w", err)
	}
	defer cursor.Close(ctx)

	var quizzes []Quiz
	if err := cursor.All(ctx, &quizzes); err != nil {
		return nil, fmt.Errorf("quiz: decode quizzes: %w", err)
	}

	return quizzes, nil
}

func (r *mongoRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*Quiz, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	var q Quiz
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&q)
	if err == mongo.ErrNoDocuments {
		return nil, fmt.Errorf("quiz: not found")
	}
	if err != nil {
		return nil, fmt.Errorf("quiz: find by id: %w", err)
	}

	return &q, nil
}

func (r *mongoRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	if _, err := r.collection.DeleteOne(ctx, bson.M{"_id": id}); err != nil {
		return fmt.Errorf("quiz: delete: %w", err)
	}

	return nil
}

func (r *mongoRepository) DeleteAll(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	if _, err := r.collection.DeleteMany(ctx, bson.M{}); err != nil {
		return fmt.Errorf("quiz: delete all: %w", err)
	}

	return nil
}
