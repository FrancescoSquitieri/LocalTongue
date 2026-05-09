import { create } from "zustand";

import type {
	WebSocketMessage,
	WebSocketStatus,
} from "@/services/websocket/Types";

export interface StoredMessage extends WebSocketMessage {
	id: string;
}

interface WebSocketStore {
	status: WebSocketStatus;
	messages: StoredMessage[];
	setStatus: (status: WebSocketStatus) => void;
	addMessage: (message: WebSocketMessage) => void;
	clearMessages: () => void;
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
	status: "idle",
	messages: [],
	setStatus: (status) => set({ status }),
	addMessage: (message) =>
		set((state) => ({
			messages: [...state.messages, { ...message, id: crypto.randomUUID() }],
		})),
	clearMessages: () => set({ messages: [] }),
}));
