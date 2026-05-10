import { X } from "lucide-react";

import AgentTranscript from "@/components/AgentTranscript/Index";
import { Button } from "@/components/ui/button";
import VoiceButton from "@/components/VoiceButton/Index";
import VoiceSelector from "@/components/VoiceSelector/Index";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { useSessionStore } from "@/stores/session";

export default function ConversationView() {
	const activeSession = useSessionStore((state) => state.activeSession);
	const isSessionReady = useSessionStore((state) => state.isSessionReady);
	const clearSession = useSessionStore((state) => state.clearSession);

	if (!activeSession) return null;

	const languageEntry = SUPPORTED_LANGUAGES.find(
		(lang) => lang.code === activeSession.languageCode,
	);
	const flag = languageEntry?.flag ?? "🌐";

	if (!isSessionReady) {
		return (
			<div className="flex flex-col items-center gap-3">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				<p className="text-sm text-muted-foreground">Initializing session…</p>
			</div>
		);
	}

	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
				<div className="flex items-center gap-2 text-sm">
					<span>{flag}</span>
					<span className="font-medium">{activeSession.language}</span>
					<span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
						{activeSession.level}
					</span>
					<span className="text-muted-foreground">·</span>
					<span className="text-muted-foreground">{activeSession.topic}</span>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={clearSession}
					aria-label="End session"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<AgentTranscript />

			<div className="flex flex-col items-center gap-4">
				<VoiceButton />
				<VoiceSelector />
			</div>
		</div>
	);
}
