import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { QuizResponse } from "@/types";

interface GetQuizzesResponse {
	quizzes: QuizResponse[];
}

interface UseGetQuizzesReturn {
	quizzes: QuizResponse[];
	isLoading: boolean;
}

export function useGetQuizzes(): UseGetQuizzesReturn {
	const { data, isLoading } = useQuery({
		queryKey: ["quizzes"],
		queryFn: async (): Promise<QuizResponse[]> => {
			const response = await baseClient.get<GetQuizzesResponse>("/quizzes");
			return response.data.quizzes;
		},
		throwOnError: false,
		meta: {
			onError: () => {
				toast.error("Could not load quizzes. Please try again.");
			},
		},
	});

	return { quizzes: data ?? [], isLoading };
}
