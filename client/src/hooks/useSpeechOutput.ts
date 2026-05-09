import { useCallback } from "react";

import { toast } from "sonner";

import { detectLanguage } from "@/lib/languageDetector";
import { findVoiceByURI, selectBestVoice } from "@/lib/voiceSelector";
import { useVoiceStore } from "@/stores/voice";

export function useSpeechOutput() {
	const setVoiceState = useVoiceStore((state) => state.setVoiceState);
	const setConversationLanguage = useVoiceStore(
		(state) => state.setConversationLanguage,
	);
	const preferredVoiceURI = useVoiceStore((state) => state.preferredVoiceURI);

	const speak = useCallback(
		(text: string): void => {
			if (!window.speechSynthesis) {
				toast.error("Text-to-speech is not supported in your browser.");
				return;
			}

			// Cancel any in-flight utterance first.
			window.speechSynthesis.cancel();

			const utterance = new SpeechSynthesisUtterance(text);

			// Resolve the voice: honour user's manual override first, then auto-detect.
			let resolvedVoice = preferredVoiceURI
				? findVoiceByURI(preferredVoiceURI)
				: null;

			if (!resolvedVoice) {
				const langCode = detectLanguage(text);
				resolvedVoice = selectBestVoice(langCode);
			}

			if (resolvedVoice) {
				utterance.voice = resolvedVoice;
				utterance.lang = resolvedVoice.lang;
				// Store the full BCP-47 tag (e.g. "it-IT") so the STT can use it
				// for better recognition accuracy on the next turn.
				setConversationLanguage(resolvedVoice.lang);
			} else {
				// No specific voice found — at least hint the language to the engine.
				const langCode = detectLanguage(text);
				utterance.lang = langCode;
				setConversationLanguage(langCode);
			}

			utterance.onstart = () => setVoiceState("speaking");
			utterance.onend = () => setVoiceState("idle");
			utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
				// "interrupted" fires when cancel() preempts an active utterance — expected.
				// "canceled" fires when the utterance is removed from the queue — also expected.
				const errorCode = event.error as string;
				const isExpected =
					errorCode === "interrupted" || errorCode === "canceled";
				if (!isExpected) {
					toast.error(
						`Speech playback failed (${event.error}). Please try again.`,
					);
				}
				setVoiceState("idle");
			};

			// Chrome bug: speak() called in the same task as cancel() is silently dropped.
			// Deferring by one event-loop tick lets cancel() flush before the new utterance
			// is enqueued. We also call resume() in case the engine was left in a paused
			// state (e.g. after the tab lost focus).
			setTimeout(() => {
				if (window.speechSynthesis.paused) {
					window.speechSynthesis.resume();
				}
				window.speechSynthesis.speak(utterance);
			}, 50);
		},
		[setVoiceState, setConversationLanguage, preferredVoiceURI],
	);

	const stopSpeaking = useCallback((): void => {
		window.speechSynthesis.cancel();
		setVoiceState("idle");
	}, [setVoiceState]);

	return { speak, stopSpeaking };
}
