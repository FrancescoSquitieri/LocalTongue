import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { QuizResponse } from "@/types";

interface UseGetQuizReturn {
	quiz: QuizResponse | undefined;
	isLoading: boolean;
}

export function useGetQuiz(id: string | undefined): UseGetQuizReturn {
	const { data: quiz, isLoading } = useQuery({
		queryKey: ["quizzes", id],
		enabled: id !== undefined,
		queryFn: async (): Promise<QuizResponse> => {
			const response = await baseClient.get<QuizResponse>(`/quizzes/${id}`);
			return response.data;
		},
		throwOnError: false,
		meta: {
			onError: () => {
				toast.error("Could not load quiz. Please try again.");
			},
		},
	});

	return { quiz, isLoading };
}
