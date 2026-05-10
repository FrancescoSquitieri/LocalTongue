package lmstudio

import "fmt"

// SessionConfig carries the session context used to build a dynamic system prompt.
type SessionConfig struct {
	Language string
	Level    string
	Topic    string
}

// BuildSystemPrompt assembles a tailored system prompt from the session config.
func BuildSystemPrompt(config SessionConfig) string {
	roleSection := fmt.Sprintf(
		"You are a conversational language-learning tutor. The student is practicing %s.",
		config.Language,
	)

	levelSection := buildLevelSection(config.Level)

	topicSection := fmt.Sprintf(
		"Steer the conversation naturally toward the topic of %s. Use vocabulary, scenarios, and examples related to this theme when it fits naturally.",
		config.Topic,
	)

	coreRules := fmt.Sprintf(
		"Core rules — follow them in every reply:\n"+
			"1. Always reply in %s. Never switch to another language.\n"+
			"2. Keep replies SHORT: 1–3 sentences for everyday conversation. Never use bullet points or numbered lists unless explicitly asked.\n"+
			"3. Never repeat or paraphrase what the user just said unless correcting an error.\n"+
			"4. When correcting a mistake, state the correct form in one sentence, then continue the conversation naturally.\n"+
			"5. No meta-commentary like \"Great question!\" or \"Of course!\". Go straight to the point.",
		config.Language,
	)

	return fmt.Sprintf("%s\n\n%s\n\n%s\n\n%s", roleSection, levelSection, topicSection, coreRules)
}

func buildLevelSection(level string) string {
	switch level {
	case "A1", "A2":
		return fmt.Sprintf(
			"The student is a beginner (%s). Use only the most common, simple vocabulary. Keep every sentence very short. One idea per sentence. When correcting mistakes, always give the simplest possible corrected form. Be patient and encouraging without being overly enthusiastic.",
			level,
		)
	case "B1", "B2":
		return fmt.Sprintf(
			"The student is at an intermediate level (%s). Use everyday language with some variety. Occasionally introduce a common idiomatic expression or useful phrase. When correcting mistakes, give the corrected form with a very brief note. Keep explanations to one sentence.",
			level,
		)
	case "C1", "C2":
		return fmt.Sprintf(
			"The student is at an advanced level (%s). Use natural, varied language freely. Feel free to use idioms, colloquial expressions, and complex sentence structures. Only correct significant errors that would confuse a native speaker.",
			level,
		)
	default:
		return fmt.Sprintf("The student is at level %s. Adapt your language to their level appropriately.", level)
	}
}
