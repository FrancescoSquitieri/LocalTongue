import { toast } from "sonner";

import type { WebSocketMessage } from "@/services/websocket/Types";
import { useSessionStore } from "@/stores/session";
import { useWebSocketStore } from "@/stores/websocket";

const WEBSOCKET_URL = "ws://localhost:3001/ws";

class WebSocketService {
	private socket: WebSocket | null = null;
	private wasConnected = false;

	connect(): void {
		const readyState = this.socket?.readyState;
		if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING)
			return;
		useWebSocketStore.getState().setStatus("connecting");
		this.socket = new WebSocket(WEBSOCKET_URL);
		this.socket.onopen = this.handleOpen;
		this.socket.onclose = this.handleClose;
		this.socket.onerror = this.handleError;
		this.socket.onmessage = this.handleMessage;
	}

	disconnect(): void {
		this.socket?.close();
		this.socket = null;
	}

	send(message: WebSocketMessage): void {
		if (this.socket?.readyState !== WebSocket.OPEN) return;
		this.socket.send(JSON.stringify(message));
	}

	initSession(sessionId: string): void {
		this.send({ type: "init_session", payload: { sessionId } });
	}

	private handleOpen = (): void => {
		this.wasConnected = true;
		useWebSocketStore.getState().setStatus("connected");
		toast.success("Connected.");
	};

	private handleClose = (): void => {
		if (this.wasConnected) toast.warning("Connection lost. Reconnecting...");
		this.wasConnected = false;
		useWebSocketStore.getState().setStatus("disconnected");
	};

	private handleError = (): void => {
		useWebSocketStore.getState().setStatus("error");
		toast.error("Connection error. Please refresh the page.");
	};

	private handleMessage = (event: MessageEvent): void => {
		try {
			const message = JSON.parse(event.data as string) as WebSocketMessage;
			useWebSocketStore.getState().addMessage(message);

			if (message.type === "session_ready") {
				useSessionStore.getState().setSessionReady(true);
			}
		} catch {
			toast.error("Connection error. Please refresh the page.");
		}
	};
}

export const websocketService = new WebSocketService();
