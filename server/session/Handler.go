package session

import (
	"encoding/json"
	"net/http"
	"strings"
)

// Handler exposes HTTP endpoints for session CRUD.
type Handler struct {
	service Service
}

// NewHandler returns a Handler wired to the given service.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
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

// Create handles POST /sessions.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	h.setCORSHeaders(w)

	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	response, err := h.service.Create(r.Context(), req)
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Could not create session")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetAll handles GET /sessions.
func (h *Handler) GetAll(w http.ResponseWriter, r *http.Request) {
	h.setCORSHeaders(w)

	sessions, err := h.service.GetAll(r.Context())
	if err != nil {
		h.writeError(w, http.StatusInternalServerError, "Could not load sessions")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"sessions": sessions})
}

// GetByID handles GET /sessions/{id}.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	h.setCORSHeaders(w)

	id := r.PathValue("id")
	response, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		errStr := err.Error()
		switch {
		case strings.Contains(errStr, "invalid id"):
			h.writeError(w, http.StatusBadRequest, "Invalid session ID")
		case strings.Contains(errStr, "not found"):
			h.writeError(w, http.StatusNotFound, "Session not found")
		default:
			h.writeError(w, http.StatusInternalServerError, "Could not load session")
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Delete handles DELETE /sessions/{id}.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	h.setCORSHeaders(w)

	id := r.PathValue("id")
	if err := h.service.Delete(r.Context(), id); err != nil {
		errStr := err.Error()
		switch {
		case strings.Contains(errStr, "invalid id"):
			h.writeError(w, http.StatusBadRequest, "Invalid session ID")
		case strings.Contains(errStr, "not found"):
			h.writeError(w, http.StatusNotFound, "Session not found")
		default:
			h.writeError(w, http.StatusInternalServerError, "Could not delete session")
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
