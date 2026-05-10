export interface SessionResponse {
	id: string;
	language: string;
	languageCode: string;
	level: string;
	topic: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	messageCount: number;
}

export interface MessageResponse {
	id: string;
	sessionId: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
}

export interface SessionWithMessages {
	session: SessionResponse;
	messages: MessageResponse[];
}

export interface QuizQuestion {
	question: string;
	options: string[];
	correctIndex: number;
	explanation: string;
}

export interface QuizResponse {
	id: string;
	sessionIds: string[];
	language: string;
	level: string;
	title: string;
	questions: QuizQuestion[];
	createdAt: string;
}
