import { useCallback, useRef } from "react";

import { toast } from "sonner";

import { useVoiceStore } from "@/stores/voice";

const SILENCE_DEBOUNCE_MS = 5_000;

export function useVoiceInput(onTranscript: (text: string) => void) {
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const finalTranscriptRef = useRef("");
	// Keep the callback ref in sync without triggering re-memoizations
	const onTranscriptRef = useRef(onTranscript);
	onTranscriptRef.current = onTranscript;

	const clearSilenceTimer = useCallback((): void => {
		if (silenceTimerRef.current) {
			clearTimeout(silenceTimerRef.current);
			silenceTimerRef.current = null;
		}
	}, []);

	const stopListening = useCallback((): void => {
		clearSilenceTimer();
		recognitionRef.current?.stop();
	}, [clearSilenceTimer]);

	const resetSilenceTimer = useCallback((): void => {
		clearSilenceTimer();
		silenceTimerRef.current = setTimeout(stopListening, SILENCE_DEBOUNCE_MS);
	}, [clearSilenceTimer, stopListening]);

	const startListening = useCallback((): void => {
		const SpeechRecognitionClass =
			window.SpeechRecognition ?? window.webkitSpeechRecognition;

		if (!SpeechRecognitionClass) {
			toast.error(
				"Speech recognition is not supported in your browser. Try Chrome or Edge.",
			);
			return;
		}

		finalTranscriptRef.current = "";

		const recognition = new SpeechRecognitionClass();
		recognition.continuous = true;
		recognition.interimResults = true;
		// Use the language detected from the previous agent response if available.
		// Starts as "" (browser default) and improves after the first conversation turn.
		recognition.lang = useVoiceStore.getState().conversationLanguage;

		recognition.onstart = (): void => {
			useVoiceStore.getState().setVoiceState("listening");
			resetSilenceTimer();
		};

		recognition.onresult = (event: SpeechRecognitionEvent): void => {
			let interimText = "";
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const result = event.results[i];
				if (result.isFinal) {
					finalTranscriptRef.current += result[0].transcript;
				} else {
					interimText += result[0].transcript;
				}
			}
			useVoiceStore.getState().setInterimTranscript(interimText);
			resetSilenceTimer();
		};

		recognition.onend = (): void => {
			clearSilenceTimer();
			useVoiceStore.getState().setInterimTranscript("");

			const transcript = finalTranscriptRef.current.trim();
			finalTranscriptRef.current = "";

			if (transcript) {
				useVoiceStore.getState().setVoiceState("processing");
				onTranscriptRef.current(transcript);
			} else {
				useVoiceStore.getState().setVoiceState("idle");
			}
		};

		recognition.onerror = (event: SpeechRecognitionErrorEvent): void => {
			clearSilenceTimer();
			// "no-speech" and "aborted" are expected and don't need a toast.
			if (event.error !== "no-speech" && event.error !== "aborted") {
				toast.error("Speech recognition error. Please try again.");
			}
			useVoiceStore.getState().setVoiceState("idle");
		};

		recognitionRef.current = recognition;
		recognition.start();
	}, [resetSilenceTimer, clearSilenceTimer]);

	return { startListening, stopListening };
}
