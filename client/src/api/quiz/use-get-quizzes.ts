import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { PaginatedQuizzesResponse } from "@/types";

interface UseGetQuizzesParams {
	page: number;
	languageCode: string;
}

interface UseGetQuizzesReturn {
	quizzes: PaginatedQuizzesResponse["quizzes"];
	total: number;
	totalPages: number;
	isLoading: boolean;
}

export function useGetQuizzes({
	page,
	languageCode,
}: UseGetQuizzesParams): UseGetQuizzesReturn {
	const { data, isLoading } = useQuery({
		queryKey: ["quizzes", { page, languageCode }],
		queryFn: async (): Promise<PaginatedQuizzesResponse> => {
			const params = new URLSearchParams({ page: String(page), limit: "5" });
			if (languageCode) params.set("languageCode", languageCode);
			const response = await baseClient.get<PaginatedQuizzesResponse>(
				`/quizzes?${params}`,
			);
			return response.data;
		},
		throwOnError: false,
		meta: {
			onError: () => {
				toast.error("Could not load quizzes. Please try again.");
			},
		},
	});

	return {
		quizzes: data?.quizzes ?? [],
		total: data?.total ?? 0,
		totalPages: data?.totalPages ?? 0,
		isLoading,
	};
}
