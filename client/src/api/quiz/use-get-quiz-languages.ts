import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { LanguageOption } from "@/types";

interface GetQuizLanguagesResponse {
	languages: LanguageOption[];
}

interface UseGetQuizLanguagesReturn {
	languages: LanguageOption[];
	isLoading: boolean;
}

export function useGetQuizLanguages(): UseGetQuizLanguagesReturn {
	const { data, isLoading } = useQuery({
		queryKey: ["quiz-languages"],
		queryFn: async (): Promise<LanguageOption[]> => {
			const response =
				await baseClient.get<GetQuizLanguagesResponse>("/quizzes/languages");
			return response.data.languages;
		},
		throwOnError: false,
		meta: {
			onError: () => {
				toast.error("Could not load languages. Please try again.");
			},
		},
	});

	return {
		languages: (data ?? []).filter((lang) => lang.code !== ""),
		isLoading,
	};
}
