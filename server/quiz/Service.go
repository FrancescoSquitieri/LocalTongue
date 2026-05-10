package quiz

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"local_tongue/lmstudio"
	"local_tongue/message"
	"local_tongue/session"
)

const quizSystemPrompt = "You are a language quiz generator. You always respond with ONLY a valid JSON object. No explanation, no markdown, no code fences. Just the raw JSON."

type quizService struct {
	repo Repository
}

// NewService returns a Service backed by the given quiz repository.
func NewService(repo Repository) Service {
	return &quizService{repo: repo}
}

func (s *quizService) Generate(ctx context.Context, req GenerateQuizRequest, messageRepo message.Repository, sessionRepo session.Repository) (*QuizResponse, error) {
	sessionObjectIDs := make([]primitive.ObjectID, len(req.SessionIDs))
	for i, idStr := range req.SessionIDs {
		objectID, err := primitive.ObjectIDFromHex(idStr)
		if err != nil {
			return nil, fmt.Errorf("quiz service: invalid session id %q: %w", idStr, err)
		}
		sessionObjectIDs[i] = objectID
	}

	var transcriptBuilder strings.Builder
	for _, sessionID := range sessionObjectIDs {
		messages, err := messageRepo.FindBySessionID(ctx, sessionID)
		if err != nil {
			return nil, fmt.Errorf("quiz service: get messages for session %s: %w", sessionID.Hex(), err)
		}
		for _, msg := range messages {
			if msg.Role == "user" {
				transcriptBuilder.WriteString(fmt.Sprintf("User: %s\n", msg.Content))
			} else {
				transcriptBuilder.WriteString(fmt.Sprintf("Assistant: %s\n", msg.Content))
			}
		}
	}

	userMessage := fmt.Sprintf(
		"Generate a quiz based on this %s level %s conversation.\n\n"+
			"Create exactly 5 multiple-choice questions that test vocabulary, grammar, and expressions used in the conversation.\n"+
			"Each question must have exactly 4 options (A, B, C, D style).\n\n"+
			"Conversation transcript:\n%s\n\n"+
			"Return ONLY this exact JSON structure with no other text:\n"+
			`{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}`,
		req.Level,
		req.Language,
		transcriptBuilder.String(),
	)

	rawResponse, err := lmstudio.CompleteRaw(quizSystemPrompt, userMessage)
	if err != nil {
		return nil, fmt.Errorf("quiz service: lmstudio complete: %w", err)
	}

	var llmResponse quizLLMResponse
	if err := json.Unmarshal([]byte(rawResponse), &llmResponse); err != nil {
		return nil, fmt.Errorf("quiz service: parse llm response: %w", err)
	}

	now := time.Now()
	generatedQuiz := &Quiz{
		SessionIDs:   sessionObjectIDs,
		Language:     req.Language,
		LanguageCode: req.LanguageCode,
		Level:        req.Level,
		Title:        fmt.Sprintf("%s %s Quiz — %s", req.Language, req.Level, now.Format("2 Jan 2006")),
		Questions:    llmResponse.Questions,
		CreatedAt:    now,
	}

	if err := s.repo.Create(ctx, generatedQuiz); err != nil {
		return nil, fmt.Errorf("quiz service: create: %w", err)
	}

	response := generatedQuiz.ToResponse()
	return &response, nil
}

func (s *quizService) GetPaginated(ctx context.Context, filter QuizFilter, page, limit int) (*PaginatedQuizzesResponse, error) {
	quizzes, total, err := s.repo.FindPaginated(ctx, filter, page, limit)
	if err != nil {
		return nil, fmt.Errorf("quiz service: get paginated: %w", err)
	}

	responses := make([]QuizResponse, len(quizzes))
	for i, q := range quizzes {
		responses[i] = q.ToResponse()
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	return &PaginatedQuizzesResponse{
		Quizzes:    responses,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (s *quizService) GetLanguages(ctx context.Context) ([]LanguageOption, error) {
	languages, err := s.repo.FindDistinctLanguages(ctx)
	if err != nil {
		return nil, fmt.Errorf("quiz service: get languages: %w", err)
	}
	return languages, nil
}

func (s *quizService) GetByID(ctx context.Context, id string) (*QuizResponse, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("quiz service: invalid id: %w", err)
	}

	q, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		return nil, err
	}

	response := q.ToResponse()
	return &response, nil
}

func (s *quizService) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("quiz service: invalid id: %w", err)
	}

	if err := s.repo.Delete(ctx, objectID); err != nil {
		return fmt.Errorf("quiz service: delete: %w", err)
	}

	return nil
}

func (s *quizService) DeleteAll(ctx context.Context) error {
	if err := s.repo.DeleteAll(ctx); err != nil {
		return fmt.Errorf("quiz service: delete all: %w", err)
	}

	return nil
}
