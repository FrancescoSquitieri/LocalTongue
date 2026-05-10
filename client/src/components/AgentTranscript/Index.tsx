import { cn } from "@/lib/utils";
import { useWebSocketStore } from "@/stores/websocket";

interface AgentTranscriptProps {
	className?: string;
}

export default function AgentTranscript({ className }: AgentTranscriptProps) {
	const messages = useWebSocketStore((state) => state.messages);

	const lastAgentMessage = [...messages]
		.reverse()
		.find((message) => message.type === "agent_response");

	const displayText =
		typeof lastAgentMessage?.payload === "string"
			? lastAgentMessage.payload
			: null;

	return (
		<div className={cn("rounded-lg bg-muted/40 p-4", className)}>
			{displayText !== null ? (
				<p className="text-sm leading-relaxed text-foreground">{displayText}</p>
			) : (
				<p className="text-sm italic text-muted-foreground">
					Agent responses will appear here.
				</p>
			)}
		</div>
	);
}
