import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CONVERSATION_TOPICS } from "@/lib/constants";

interface TopicSelectorProps {
	value: string;
	onChange: (value: string) => void;
}

export function TopicSelector({ value, onChange }: TopicSelectorProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<p className="text-xs font-medium text-muted-foreground">Topic</p>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select a topic" />
				</SelectTrigger>
				<SelectContent position="popper">
					{CONVERSATION_TOPICS.map((topic) => (
						<SelectItem key={topic} value={topic}>
							{topic}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
