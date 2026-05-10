import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { PaginatedSessionsResponse } from "@/types";

interface UseGetSessionsParams {
	page: number;
	languageCode: string;
}

interface UseGetSessionsReturn {
	sessions: PaginatedSessionsResponse["sessions"];
	total: number;
	totalPages: number;
	isLoading: boolean;
}

export function useGetSessions({
	page,
	languageCode,
}: UseGetSessionsParams): UseGetSessionsReturn {
	const { data, isLoading } = useQuery({
		queryKey: ["sessions", { page, languageCode }],
		queryFn: async (): Promise<PaginatedSessionsResponse> => {
			const params = new URLSearchParams({ page: String(page), limit: "5" });
			if (languageCode) params.set("languageCode", languageCode);
			const response = await baseClient.get<PaginatedSessionsResponse>(
				`/sessions?${params}`,
			);
			return response.data;
		},
		throwOnError: false,
		meta: {
			onError: () => {
				toast.error("Could not load sessions. Please try again.");
			},
		},
	});

	return {
		sessions: data?.sessions ?? [],
		total: data?.total ?? 0,
		totalPages: data?.totalPages ?? 0,
		isLoading,
	};
}
