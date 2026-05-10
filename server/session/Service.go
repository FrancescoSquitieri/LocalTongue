package session

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"local_tongue/message"
)

type sessionService struct {
	repo        Repository
	messageRepo message.Repository
}

// NewService returns a Service backed by the given repositories.
func NewService(repo Repository, messageRepo message.Repository) Service {
	return &sessionService{repo: repo, messageRepo: messageRepo}
}

func (s *sessionService) Create(ctx context.Context, req CreateSessionRequest) (*SessionResponse, error) {
	now := time.Now()
	sess := &Session{
		Language:     req.Language,
		LanguageCode: req.LanguageCode,
		Level:        req.Level,
		Topic:        req.Topic,
		Title:        fmt.Sprintf("%s %s — %s", req.Language, req.Level, now.Format("2 Jan 2006")),
		CreatedAt:    now,
		UpdatedAt:    now,
		MessageCount: 0,
	}

	if err := s.repo.Create(ctx, sess); err != nil {
		return nil, fmt.Errorf("session service: create: %w", err)
	}

	response := sess.ToResponse()
	return &response, nil
}

func (s *sessionService) GetPaginated(ctx context.Context, filter SessionFilter, page, limit int) (*PaginatedSessionsResponse, error) {
	sessions, total, err := s.repo.FindPaginated(ctx, filter, page, limit)
	if err != nil {
		return nil, fmt.Errorf("session service: get paginated: %w", err)
	}

	responses := make([]SessionResponse, len(sessions))
	for i, sess := range sessions {
		responses[i] = sess.ToResponse()
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	return &PaginatedSessionsResponse{
		Sessions:   responses,
		Total:      total,
		Page:       page,
		TotalPages: totalPages,
	}, nil
}

func (s *sessionService) GetLanguages(ctx context.Context) ([]LanguageOption, error) {
	languages, err := s.repo.FindDistinctLanguages(ctx)
	if err != nil {
		return nil, fmt.Errorf("session service: get languages: %w", err)
	}
	return languages, nil
}

func (s *sessionService) GetByID(ctx context.Context, id string) (*SessionWithMessagesResponse, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("session service: invalid id: %w", err)
	}

	sess, err := s.repo.FindByID(ctx, objectID)
	if err != nil {
		return nil, err
	}

	messages, err := s.messageRepo.FindBySessionID(ctx, objectID)
	if err != nil {
		return nil, fmt.Errorf("session service: get messages: %w", err)
	}

	messageResponses := make([]message.MessageResponse, len(messages))
	for i, msg := range messages {
		messageResponses[i] = msg.ToResponse()
	}

	return &SessionWithMessagesResponse{
		Session:  sess.ToResponse(),
		Messages: messageResponses,
	}, nil
}

func (s *sessionService) Delete(ctx context.Context, id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("session service: invalid id: %w", err)
	}

	if err := s.messageRepo.DeleteBySessionID(ctx, objectID); err != nil {
		return fmt.Errorf("session service: delete messages: %w", err)
	}

	if err := s.repo.Delete(ctx, objectID); err != nil {
		return fmt.Errorf("session service: delete: %w", err)
	}

	return nil
}

func (s *sessionService) DeleteAll(ctx context.Context) error {
	if err := s.messageRepo.DeleteAll(ctx); err != nil {
		return fmt.Errorf("session service: delete all messages: %w", err)
	}

	if err := s.repo.DeleteAll(ctx); err != nil {
		return fmt.Errorf("session service: delete all sessions: %w", err)
	}

	return nil
}
