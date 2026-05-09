import { websocketService } from "@/services/websocket";
import type { WebSocketMessage } from "@/services/websocket/Types";
import type { StoredMessage } from "@/stores/websocket";
import { useWebSocketStore } from "@/stores/websocket";

interface UseWebSocketReturn {
	status: ReturnType<typeof useWebSocketStore.getState>["status"];
	messages: StoredMessage[];
	sendMessage: (message: WebSocketMessage) => void;
	clearMessages: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
	const status = useWebSocketStore((state) => state.status);
	const messages = useWebSocketStore((state) => state.messages);
	const clearMessages = useWebSocketStore((state) => state.clearMessages);

	const sendMessage = (message: WebSocketMessage): void => {
		websocketService.send(message);
	};

	return { status, messages, sendMessage, clearMessages };
}
