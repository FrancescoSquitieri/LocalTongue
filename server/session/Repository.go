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

func (r *mongoRepository) FindPaginated(ctx context.Context, filter SessionFilter, page, limit int) ([]Session, int64, error) {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	mongoFilter := bson.M{}
	if filter.LanguageCode != "" {
		mongoFilter["languageCode"] = filter.LanguageCode
	}

	total, err := r.collection.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, 0, fmt.Errorf("session: count: %w", err)
	}

	skip := int64((page - 1) * limit)
	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(skip).
		SetLimit(int64(limit))

	cursor, err := r.collection.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, 0, fmt.Errorf("session: find paginated: %w", err)
	}
	defer cursor.Close(ctx)

	var sessions []Session
	if err := cursor.All(ctx, &sessions); err != nil {
		return nil, 0, fmt.Errorf("session: decode sessions: %w", err)
	}

	return sessions, total, nil
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
		return nil, fmt.Errorf("session: distinct languages: %w", err)
	}
	defer cursor.Close(ctx)

	var raw []struct {
		Code string `bson:"_id"`
		Name string `bson:"name"`
	}
	if err := cursor.All(ctx, &raw); err != nil {
		return nil, fmt.Errorf("session: decode languages: %w", err)
	}

	languages := make([]LanguageOption, len(raw))
	for i, item := range raw {
		languages[i] = LanguageOption{Code: item.Code, Name: item.Name}
	}
	return languages, nil
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

func (r *mongoRepository) DeleteAll(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, operationTimeout)
	defer cancel()

	if _, err := r.collection.DeleteMany(ctx, bson.M{}); err != nil {
		return fmt.Errorf("session: delete all: %w", err)
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
