import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { QuizResponse } from "@/types";

interface CreateQuizBody {
	sessionIds: string[];
	language: string;
	level: string;
}

interface UseCreateQuizReturn {
	createQuiz: (body: CreateQuizBody) => void;
	isPending: boolean;
	data: QuizResponse | undefined;
}

export function useCreateQuiz(): UseCreateQuizReturn {
	const queryClient = useQueryClient();

	const {
		mutate: createQuiz,
		isPending,
		data,
	} = useMutation({
		mutationFn: async (body: CreateQuizBody): Promise<QuizResponse> => {
			const response = await baseClient.post<QuizResponse>("/quizzes", body);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quizzes"] });
		},
		onError: () => {
			toast.error("Could not generate quiz. Please try again.");
		},
	});

	return { createQuiz, isPending, data };
}
