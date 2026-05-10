import { cn } from "@/lib/utils";
import type { MessageResponse } from "@/types";

interface MessageBubbleProps {
	message: MessageResponse;
}

export function MessageBubble({ message }: MessageBubbleProps) {
	const isUser = message.role === "user";

	return (
		<div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[80%] rounded-lg px-3 py-2 text-sm",
					isUser
						? "bg-primary text-primary-foreground"
						: "bg-muted text-foreground",
				)}
			>
				{message.content}
			</div>
		</div>
	);
}
