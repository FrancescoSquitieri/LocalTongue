import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";

interface UseDeleteAllQuizzesReturn {
	deleteAllQuizzes: () => void;
	isPending: boolean;
}

export function useDeleteAllQuizzes(): UseDeleteAllQuizzesReturn {
	const queryClient = useQueryClient();

	const { mutate: deleteAllQuizzes, isPending } = useMutation({
		mutationFn: async (): Promise<void> => {
			await baseClient.delete("/quizzes");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quizzes"] });
			queryClient.invalidateQueries({ queryKey: ["quiz-languages"] });
		},
		onError: () => {
			toast.error("Could not delete all quizzes. Please try again.");
		},
	});

	return { deleteAllQuizzes, isPending };
}
