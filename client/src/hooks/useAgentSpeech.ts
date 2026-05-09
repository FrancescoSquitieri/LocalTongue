import { useEffect, useRef } from "react";

import { toast } from "sonner";

import { useSpeechOutput } from "@/hooks/useSpeechOutput";
import { useVoiceStore } from "@/stores/voice";
import { useWebSocketStore } from "@/stores/websocket";

export function useAgentSpeech(): void {
	const messages = useWebSocketStore((state) => state.messages);
	const { speak } = useSpeechOutput();
	const processedCountRef = useRef(0);

	useEffect(() => {
		const newMessages = messages.slice(processedCountRef.current);
		processedCountRef.current = messages.length;

		for (const message of newMessages) {
			if (message.type === "error" && typeof message.payload === "string") {
				toast.error(message.payload);
				useVoiceStore.getState().setVoiceState("idle");
			} else if (
				message.type === "agent_response" &&
				typeof message.payload === "string"
			) {
				speak(message.payload);
			}
		}
	}, [messages, speak]);
}
