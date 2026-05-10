import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { baseClient } from "@/api/baseClient";
import { websocketService } from "@/services/websocket";
import { useSessionStore } from "@/stores/session";
import { useWebSocketStore } from "@/stores/websocket";
import type { SessionResponse } from "@/types";

interface CreateSessionBody {
	language: string;
	languageCode: string;
	level: string;
	topic: string;
}

interface UseCreateSessionReturn {
	createSession: (body: CreateSessionBody) => void;
	isPending: boolean;
}

export function useCreateSession(): UseCreateSessionReturn {
	const { mutate: createSession, isPending } = useMutation({
		mutationFn: async (body: CreateSessionBody): Promise<SessionResponse> => {
			const response = await baseClient.post<SessionResponse>(
				"/sessions",
				body,
			);
			return response.data;
		},
		onSuccess: (session) => {
			useWebSocketStore.getState().clearMessages();
			useSessionStore.getState().setActiveSession(session);
			websocketService.initSession(session.id);
		},
		onError: () => {
			toast.error("Could not create session. Please try again.");
		},
	});

	return { createSession, isPending };
}
