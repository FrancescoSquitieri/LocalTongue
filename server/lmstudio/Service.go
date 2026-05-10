package lmstudio

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

const (
	lmStudioEndpoint   = "http://127.0.0.1:1234/v1/chat/completions"
	modelName          = "local-model"
	defaultTemperature = 0.7
	rawTemperature     = 0.3
	requestTimeout     = 60 * time.Second
)

var httpClient = &http.Client{Timeout: requestTimeout}

// Complete sends the conversation history plus the new user message to LM Studio
// using a dynamic system prompt built from the session config.
func Complete(config SessionConfig, history []ChatMessage, userMessage string) (string, error) {
	systemPrompt := BuildSystemPrompt(config)
	messages := buildMessages(systemPrompt, history, userMessage)
	return sendRequest(messages, defaultTemperature)
}

// CompleteRaw sends a single user message with no history and a custom system prompt.
// Uses lower temperature for deterministic output. Used for quiz generation.
func CompleteRaw(systemPromptText, userMessage string) (string, error) {
	messages := []ChatMessage{
		{Role: "system", Content: systemPromptText},
		{Role: "user", Content: userMessage},
	}
	return sendRequest(messages, rawTemperature)
}

// sendRequest handles the actual HTTP call to LM Studio and returns the reply text.
func sendRequest(messages []ChatMessage, temperature float64) (string, error) {
	requestBody := chatRequest{
		Model:       modelName,
		Messages:    messages,
		Temperature: temperature,
	}

	encoded, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("lmstudio: encode request: %w", err)
	}

	log.Printf("lmstudio: sending request — %d messages, temperature %.1f", len(messages), temperature)

	resp, err := httpClient.Post(lmStudioEndpoint, "application/json", bytes.NewReader(encoded))
	if err != nil {
		return "", fmt.Errorf("lmstudio: post request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("lmstudio: unexpected status %d: %s", resp.StatusCode, body)
	}

	var chatResp chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", fmt.Errorf("lmstudio: decode response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("lmstudio: empty choices in response")
	}

	reply := strings.TrimSpace(chatResp.Choices[0].Message.Content)
	log.Printf("lmstudio: reply received (%d chars)", len(reply))
	return reply, nil
}

// buildMessages assembles the full message list: system prompt, history, then user message.
func buildMessages(systemPrompt string, history []ChatMessage, userMessage string) []ChatMessage {
	messages := make([]ChatMessage, 0, len(history)+2)
	messages = append(messages, ChatMessage{Role: "system", Content: systemPrompt})
	messages = append(messages, history...)
	messages = append(messages, ChatMessage{Role: "user", Content: userMessage})
	return messages
}
