import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import type { SessionWithMessages } from "@/types";

interface UseGetSessionReturn {
	data: SessionWithMessages | undefined;
	isLoading: boolean;
}

export function useGetSession(id: string | undefined): UseGetSessionReturn {
	const { data, isLoading } = useQuery({
		queryKey: ["sessions", id],
		enabled: id !== undefined,
		queryFn: async (): Promise<SessionWithMessages> => {
			const response = await baseClient.get<SessionWithMessages>(
				`/sessions/${id}`,
			);
			return response.data;
		},
		throwOnError: false,
		meta: {
			onError: () => {
				toast.error("Could not load session. Please try again.");
			},
		},
	});

	return { data, isLoading };
}
