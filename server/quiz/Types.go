package quiz

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// QuizQuestion represents a single multiple-choice question in a quiz.
type QuizQuestion struct {
	Question     string   `bson:"question"     json:"question"`
	Options      []string `bson:"options"      json:"options"`
	CorrectIndex int      `bson:"correctIndex" json:"correctIndex"`
	Explanation  string   `bson:"explanation"  json:"explanation"`
}

// Quiz is the BSON/DB representation of a generated quiz.
type Quiz struct {
	ID           primitive.ObjectID   `bson:"_id,omitempty" json:"-"`
	SessionIDs   []primitive.ObjectID `bson:"sessionIds"    json:"-"`
	Language     string               `bson:"language"      json:"language"`
	LanguageCode string               `bson:"languageCode"  json:"languageCode"`
	Level        string               `bson:"level"         json:"level"`
	Title        string               `bson:"title"         json:"title"`
	Questions    []QuizQuestion       `bson:"questions"     json:"questions"`
	CreatedAt    time.Time            `bson:"createdAt"     json:"createdAt"`
}

// QuizResponse is the JSON-safe DTO returned to clients.
type QuizResponse struct {
	ID           string         `json:"id"`
	SessionIDs   []string       `json:"sessionIds"`
	Language     string         `json:"language"`
	LanguageCode string         `json:"languageCode"`
	Level        string         `json:"level"`
	Title        string         `json:"title"`
	Questions    []QuizQuestion `json:"questions"`
	CreatedAt    time.Time      `json:"createdAt"`
}

// ToResponse converts a Quiz to its client-facing DTO.
func (q *Quiz) ToResponse() QuizResponse {
	sessionIDStrings := make([]string, len(q.SessionIDs))
	for i, id := range q.SessionIDs {
		sessionIDStrings[i] = id.Hex()
	}

	return QuizResponse{
		ID:           q.ID.Hex(),
		SessionIDs:   sessionIDStrings,
		Language:     q.Language,
		LanguageCode: q.LanguageCode,
		Level:        q.Level,
		Title:        q.Title,
		Questions:    q.Questions,
		CreatedAt:    q.CreatedAt,
	}
}

// GenerateQuizRequest is the body expected on POST /quizzes.
type GenerateQuizRequest struct {
	SessionIDs   []string `json:"sessionIds"`
	Language     string   `json:"language"`
	LanguageCode string   `json:"languageCode"`
	Level        string   `json:"level"`
}

// quizLLMResponse is used to unmarshal the raw JSON returned by LM Studio.
type quizLLMResponse struct {
	Questions []QuizQuestion `json:"questions"`
}

// QuizFilter holds optional query filters for FindPaginated.
type QuizFilter struct {
	LanguageCode string
}

// PaginatedQuizzesResponse is returned by GET /quizzes.
type PaginatedQuizzesResponse struct {
	Quizzes    []QuizResponse `json:"quizzes"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	TotalPages int            `json:"totalPages"`
}

// LanguageOption is a language name+code pair.
type LanguageOption struct {
	Code string `json:"code"`
	Name string `json:"name"`
}
