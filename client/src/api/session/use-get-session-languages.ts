import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { LanguageOption } from "@/types";

interface GetSessionLanguagesResponse {
	languages: LanguageOption[];
}

interface UseGetSessionLanguagesReturn {
	languages: LanguageOption[];
	isLoading: boolean;
}

export function useGetSessionLanguages(): UseGetSessionLanguagesReturn {
	const { data, isLoading } = useQuery({
		queryKey: ["session-languages"],
		queryFn: async (): Promise<LanguageOption[]> => {
			const response = await baseClient.get<GetSessionLanguagesResponse>(
				"/sessions/languages",
			);
			return response.data.languages;
		},
		throwOnError: false,
		meta: {
			onError: () => {
				toast.error("Could not load languages. Please try again.");
			},
		},
	});

	return { languages: data ?? [], isLoading };
}
