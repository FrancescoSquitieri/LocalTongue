import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { SessionResponse } from "@/types";

interface GetSessionsResponse {
	sessions: SessionResponse[];
}

interface UseGetSessionsReturn {
	sessions: SessionResponse[];
	isLoading: boolean;
}

export function useGetSessions(): UseGetSessionsReturn {
	const { data, isLoading } = useQuery({
		queryKey: ["sessions"],
		queryFn: async (): Promise<SessionResponse[]> => {
			const response = await baseClient.get<GetSessionsResponse>("/sessions");
			return response.data.sessions;
		},
		throwOnError: false,
		meta: {
			onError: () => {
				toast.error("Could not load sessions. Please try again.");
			},
		},
	});

	return { sessions: data ?? [], isLoading };
}
