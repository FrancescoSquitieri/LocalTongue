package database

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	mongoURI       = "mongodb://localhost:27017"
	databaseName   = "lingualocal"
	connectTimeout = 10 * time.Second
)

var (
	once       sync.Once
	client     *mongo.Client
	db         *mongo.Database
	connectErr error
)

// Connect initialises the MongoDB client once. Subsequent calls are no-ops and
// return the result of the first attempt.
func Connect() error {
	once.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), connectTimeout)
		defer cancel()

		clientOptions := options.Client().ApplyURI(mongoURI)
		mongoClient, err := mongo.Connect(ctx, clientOptions)
		if err != nil {
			connectErr = fmt.Errorf("database: connect: %w", err)
			return
		}

		if err := mongoClient.Ping(ctx, nil); err != nil {
			connectErr = fmt.Errorf("database: ping: %w", err)
			return
		}

		client = mongoClient
		db = mongoClient.Database(databaseName)
		log.Println("database: connected to MongoDB successfully")
	})

	return connectErr
}

// GetCollection returns a handle to the named collection in the lingualocal database.
func GetCollection(name string) *mongo.Collection {
	return db.Collection(name)
}
