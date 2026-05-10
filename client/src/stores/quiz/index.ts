import { create } from "zustand";

interface QuizStore {
	currentQuestionIndex: number;
	selectedAnswers: Record<number, number>;
	isFinished: boolean;
	setAnswer: (questionIndex: number, optionIndex: number) => void;
	nextQuestion: (totalQuestions: number) => void;
	resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
	currentQuestionIndex: 0,
	selectedAnswers: {},
	isFinished: false,
	setAnswer: (questionIndex, optionIndex) =>
		set((state) => ({
			selectedAnswers: {
				...state.selectedAnswers,
				[questionIndex]: optionIndex,
			},
		})),
	nextQuestion: (totalQuestions) =>
		set((state) => {
			const nextIndex = state.currentQuestionIndex + 1;
			if (nextIndex >= totalQuestions) {
				return { isFinished: true };
			}
			return { currentQuestionIndex: nextIndex };
		}),
	resetQuiz: () =>
		set({ currentQuestionIndex: 0, selectedAnswers: {}, isFinished: false }),
}));
