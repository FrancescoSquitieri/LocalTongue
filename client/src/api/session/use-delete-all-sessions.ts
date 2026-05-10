import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";

interface UseDeleteAllSessionsReturn {
	deleteAllSessions: () => void;
	isPending: boolean;
}

export function useDeleteAllSessions(): UseDeleteAllSessionsReturn {
	const queryClient = useQueryClient();

	const { mutate: deleteAllSessions, isPending } = useMutation({
		mutationFn: async (): Promise<void> => {
			await baseClient.delete("/sessions");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["session-languages"] });
		},
		onError: () => {
			toast.error("Could not delete all sessions. Please try again.");
		},
	});

	return { deleteAllSessions, isPending };
}
