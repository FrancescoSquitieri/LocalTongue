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
	languageCode: string;
	level: string;
	title: string;
	questions: QuizQuestion[];
	createdAt: string;
}

export interface LanguageOption {
	code: string;
	name: string;
}

export interface PaginatedSessionsResponse {
	sessions: SessionResponse[];
	total: number;
	page: number;
	totalPages: number;
}

export interface PaginatedQuizzesResponse {
	quizzes: QuizResponse[];
	total: number;
	page: number;
	totalPages: number;
}
