import { Microphone, SpinnerGap } from "@phosphor-icons/react";
import { useCallback } from "react";
import { useSpeechOutput } from "@/hooks/useSpeechOutput";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useWebSocket } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/stores/voice";
import { useVoiceStore } from "@/stores/voice";

const BUTTON_LABEL: Record<VoiceState, string> = {
	idle: "Start speaking",
	listening: "Listening — click to stop",
	processing: "Processing…",
	speaking: "Speaking — click to interrupt",
};

const STATUS_TEXT: Record<VoiceState, string> = {
	idle: "",
	listening: "Listening…",
	processing: "Processing…",
	speaking: "Speaking…",
};

export default function VoiceButton() {
	const voiceState = useVoiceStore((state) => state.voiceState);
	const interimTranscript = useVoiceStore((state) => state.interimTranscript);

	const { sendMessage } = useWebSocket();
	const { stopSpeaking } = useSpeechOutput();

	const handleTranscript = useCallback(
		(text: string): void => {
			sendMessage({ type: "user_message", payload: text });
		},
		[sendMessage],
	);

	const { startListening, stopListening } = useVoiceInput(handleTranscript);

	const handleClick = (): void => {
		if (voiceState === "idle") {
			startListening();
		} else if (voiceState === "listening") {
			stopListening();
		} else if (voiceState === "speaking") {
			stopSpeaking();
			startListening();
		}
		// Do nothing during "processing"
	};

	const isListening = voiceState === "listening";
	const isSpeaking = voiceState === "speaking";
	const isProcessing = voiceState === "processing";

	return (
		<div className="flex flex-col items-center gap-6">
			{/* Button + rings wrapper */}
			<div className="relative flex h-24 w-24 items-center justify-center">
				{/* Listening rings — blue, 3 staggered */}
				{isListening && (
					<>
						<span className="absolute inset-0 rounded-full bg-blue-500/50 animate-ripple" />
						<span
							className="absolute inset-0 rounded-full bg-blue-500/35 animate-ripple"
							style={{ animationDelay: "0.55s" }}
						/>
						<span
							className="absolute inset-0 rounded-full bg-blue-500/20 animate-ripple"
							style={{ animationDelay: "1.1s" }}
						/>
					</>
				)}

				{/* Speaking rings — violet, 2 slower rings */}
				{isSpeaking && (
					<>
						<span
							className="absolute inset-0 rounded-full bg-violet-500/50 animate-ripple"
							style={{ animationDuration: "2.4s" }}
						/>
						<span
							className="absolute inset-0 rounded-full bg-violet-500/30 animate-ripple"
							style={{ animationDuration: "2.4s", animationDelay: "0.8s" }}
						/>
					</>
				)}

				<button
					type="button"
					onClick={handleClick}
					disabled={isProcessing}
					aria-label={BUTTON_LABEL[voiceState]}
					className={cn(
						"relative z-10 flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-all duration-300",
						isListening &&
							"scale-105 bg-blue-500 text-white shadow-blue-500/30",
						isSpeaking && "bg-violet-500 text-white shadow-violet-500/30",
						isProcessing &&
							"animate-pulse cursor-not-allowed bg-muted text-muted-foreground",
						!isListening &&
							!isSpeaking &&
							!isProcessing &&
							"bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90",
					)}
				>
					{isProcessing ? (
						<SpinnerGap className="h-8 w-8 animate-spin" weight="bold" />
					) : (
						<Microphone className="h-8 w-8" weight="fill" />
					)}
				</button>
			</div>

			{/* Status + interim transcript */}
			<div className="min-h-[2.5rem] text-center">
				{isListening && interimTranscript ? (
					<p className="max-w-xs text-sm italic text-muted-foreground">
						{interimTranscript}
					</p>
				) : (
					<p className="text-sm text-muted-foreground">
						{STATUS_TEXT[voiceState]}
					</p>
				)}
			</div>
		</div>
	);
}
