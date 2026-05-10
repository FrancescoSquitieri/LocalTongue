import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";

interface UseDeleteQuizReturn {
	deleteQuiz: (id: string) => void;
	isPending: boolean;
}

export function useDeleteQuiz(): UseDeleteQuizReturn {
	const queryClient = useQueryClient();

	const { mutate: deleteQuiz, isPending } = useMutation({
		mutationFn: async (id: string): Promise<void> => {
			await baseClient.delete(`/quizzes/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quizzes"] });
		},
		onError: () => {
			toast.error("Could not delete quiz. Please try again.");
		},
	});

	return { deleteQuiz, isPending };
}
