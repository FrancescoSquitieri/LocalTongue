import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";

interface UseDeleteSessionReturn {
	deleteSession: (id: string) => void;
	isPending: boolean;
}

export function useDeleteSession(): UseDeleteSessionReturn {
	const queryClient = useQueryClient();

	const { mutate: deleteSession, isPending } = useMutation({
		mutationFn: async (id: string): Promise<void> => {
			await baseClient.delete(`/sessions/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
		},
		onError: () => {
			toast.error("Could not delete session. Please try again.");
		},
	});

	return { deleteSession, isPending };
}
