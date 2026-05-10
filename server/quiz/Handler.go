package quiz

import (
	"encoding/json"
	"net/http"
	"strings"

	"local_tongue/message"
	"local_tongue/session"
)

// Handler exposes HTTP endpoints for quiz generation and retrieval.
type Handler struct {
	service     Service
	messageRepo message.Repository
	sessionRepo session.Repository
}

// NewHandler returns a Handler wired to the given service and repositories.
func NewHandler(service Service, messageRepo message.Repository, sessionRepo session.Repository) *Handler {
	return &Handler{
		service:     service,
		messageRepo: messageRepo,
		sessionRepo: sessionRepo,
	}
}

func (h *Handler) setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func (h *Handler) writeError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// Generate handles POST /quizzes.
func (h *Handler) Generate(w http.ResponseWriter, r *http.Request) {
	h.setCORSHeaders(w)

	var req GenerateQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	response, err := h.service.Generate(r.Context(), req, h.messageRepo, h.sessionRepo)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Could not generate quiz")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetAll handles GET /quizzes.
func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	h.setCORSHeaders(w)

	quizzes, err := h.service.GetAll(r.Context())
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Could not load quizzes")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"quizzes": quizzes})
}

// Delete handles DELETE /quizzes/{id}.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	h.setCORSHeaders(w)

	id := r.PathValue("id")
	if err := h.service.Delete(r.Context(), id); err != nil {
		errStr := err.Error()
		switch {
		case strings.Contains(errStr, "invalid id"):
			h.writeError(w, http.StatusBadRequest, "Invalid quiz ID")
		case strings.Contains(errStr, "not found"):
			h.writeError(w, http.StatusNotFound, "Quiz not found")
		default:
			h.writeError(w, http.StatusInternalServerError, "Could not delete quiz")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	h.setCORSHeaders(w)

	id := r.PathValue("id")
	response, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		errStr := err.Error()
		switch {
		case strings.Contains(errStr, "invalid id"):
			h.writeError(w, http.StatusBadRequest, "Invalid quiz ID")
		case strings.Contains(errStr, "not found"):
			h.writeError(w, http.StatusNotFound, "Quiz not found")
		default:
			h.writeError(w, http.StatusInternalServerError, "Could not load quiz")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
