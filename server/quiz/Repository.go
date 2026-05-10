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

func (r *mongoRepository) FindPaginated(ctx context.Context, filter QuizFilter, page, limit int) ([]Quiz, int64, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	mongoFilter := bson.M{}
	if filter.LanguageCode != "" {
		mongoFilter["languageCode"] = filter.LanguageCode
	}

	total, err := r.collection.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, 0, fmt.Errorf("quiz: count: %w", err)
	}

	skip := int64((page - 1) * limit)
	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(skip).
		SetLimit(int64(limit))

	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, 0, fmt.Errorf("quiz: find paginated: %w", err)
	}
	defer cursor.Close(ctx)

	var quizzes []Quiz
	if err := cursor.All(ctx, &quizzes); err != nil {
		return nil, 0, fmt.Errorf("quiz: decode quizzes: %w", err)
	}

	return quizzes, total, nil
}

func (r *mongoRepository) FindDistinctLanguages(ctx context.Context) ([]LanguageOption, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$languageCode"},
			{Key: "name", Value: bson.D{{Key: "$first", Value: "$language"}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "name", Value: 1}}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("quiz: distinct languages: %w", err)
	}
	defer cursor.Close(ctx)

	var raw []struct {
		Code string `bson:"_id"`
		Name string `bson:"name"`
	}
	if err := cursor.All(ctx, &raw); err != nil {
		return nil, fmt.Errorf("quiz: decode languages: %w", err)
	}

	languages := make([]LanguageOption, len(raw))
	for i, item := range raw {
		languages[i] = LanguageOption{Code: item.Code, Name: item.Name}
	}
	return languages, nil
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
