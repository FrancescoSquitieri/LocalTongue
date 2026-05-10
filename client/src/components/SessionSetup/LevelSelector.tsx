import { Button } from "@/components/ui/button";
import { LANGUAGE_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LevelSelectorProps {
	value: string;
	onChange: (value: string) => void;
}

export function LevelSelector({ value, onChange }: LevelSelectorProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<p className="text-xs font-medium text-muted-foreground">Level</p>
			<div className="flex gap-1.5 flex-wrap">
				{LANGUAGE_LEVELS.map((level) => (
					<Button
						key={level}
						type="button"
						variant={value === level ? "default" : "outline"}
						size="sm"
						onClick={() => onChange(level)}
						className={cn("flex-1", value === level && "font-semibold")}
					>
						{level}
					</Button>
				))}
			</div>
		</div>
	);
}
