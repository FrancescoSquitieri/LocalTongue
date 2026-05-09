export type WebSocketStatus =
	| "idle"
	| "connecting"
	| "connected"
	| "disconnected"
	| "error";

export interface WebSocketMessage {
	type: string;
	payload: unknown;
}
