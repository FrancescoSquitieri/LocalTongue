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
	requestTimeout     = 60 * time.Second
	systemPrompt       = `You are a conversational language-learning tutor.

Core rules — follow them in every reply:
1. Always respond in the same language the user speaks to you.
2. Keep replies SHORT: 1–3 sentences for everyday conversation. Never add unsolicited lists, bullet points, or long explanations.
3. Be exhaustive ONLY when the user explicitly asks for an explanation, a rule, or a correction. Even then, be as concise as possible.
4. Never repeat or paraphrase what the user just said unless it contains a mistake you are correcting.
5. When correcting a mistake, give the corrected form in one sentence, then continue the conversation naturally.
6. Do not add meta-commentary such as "Great question!" or "Of course!". Go straight to the point.`
)

var httpClient = &http.Client{Timeout: requestTimeout}

// Complete sends the conversation history plus the new user message to LM Studio
// and returns the assistant's reply.
func Complete(history []ChatMessage, userMessage string) (string, error) {
	messages := buildMessages(history, userMessage)

	requestBody := chatRequest{
		Model:       modelName,
		Messages:    messages,
		Temperature: defaultTemperature,
	}

	encoded, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("lmstudio: encode request: %w", err)
	}

	log.Printf("lmstudio: sending request to %s — %d messages", lmStudioEndpoint, len(messages))

	resp, err := httpClient.Post(lmStudioEndpoint, "application/json", bytes.NewReader(encoded))
	if err != nil {
		return "", fmt.Errorf("lmstudio: post request: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("lmstudio: response status %d", resp.StatusCode)

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
func buildMessages(history []ChatMessage, userMessage string) []ChatMessage {
	messages := make([]ChatMessage, 0, len(history)+2)
	messages = append(messages, ChatMessage{Role: "system", Content: systemPrompt})
	messages = append(messages, history...)
	messages = append(messages, ChatMessage{Role: "user", Content: userMessage})
	return messages
}
