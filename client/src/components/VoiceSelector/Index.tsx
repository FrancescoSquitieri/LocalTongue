import { useEffect, useState } from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { VoiceInfo } from "@/lib/voiceSelector";
import { getAllVoicesWithInfo } from "@/lib/voiceSelector";
import { useVoiceStore } from "@/stores/voice";

const AUTO_VALUE = "__auto__";

const QUALITY_BADGE_CLASSES: Record<string, string> = {
	Premium: "bg-amber-100 text-amber-800 border-amber-300",
	Enhanced: "bg-blue-100 text-blue-800 border-blue-300",
	Neural: "bg-violet-100 text-violet-800 border-violet-300",
	Natural: "bg-green-100 text-green-800 border-green-300",
	Online: "bg-sky-100 text-sky-800 border-sky-300",
	Compact: "bg-gray-100 text-gray-500 border-gray-300",
	Standard: "bg-gray-100 text-gray-500 border-gray-300",
};

interface QualityBadgeProps {
	label: string;
}

function QualityBadge({ label }: QualityBadgeProps) {
	const classes =
		QUALITY_BADGE_CLASSES[label] ?? "bg-gray-100 text-gray-500 border-gray-300";

	return (
		<span
			className={`ml-1.5 rounded border px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${classes}`}
		>
			{label}
		</span>
	);
}

export default function VoiceSelector() {
	const preferredVoiceURI = useVoiceStore((state) => state.preferredVoiceURI);
	const setPreferredVoiceURI = useVoiceStore(
		(state) => state.setPreferredVoiceURI,
	);

	const [voices, setVoices] = useState<VoiceInfo[]>([]);

	// Voices load asynchronously — refresh when the browser fires voiceschanged.
	useEffect(() => {
		function loadVoices() {
			setVoices(getAllVoicesWithInfo());
		}

		loadVoices();
		window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

		return () => {
			window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
		};
	}, []);

	const selectedValue = preferredVoiceURI ?? AUTO_VALUE;

	function handleValueChange(value: string) {
		setPreferredVoiceURI(value === AUTO_VALUE ? null : value);
	}

	return (
		<div className="flex flex-col items-center gap-1.5">
			<span className="text-xs font-medium text-muted-foreground">
				Response voice
			</span>
			<Select value={selectedValue} onValueChange={handleValueChange}>
				<SelectTrigger className="w-72 text-sm">
					<SelectValue placeholder="Auto (detect language)" />
				</SelectTrigger>
				<SelectContent position="popper" style={{ maxHeight: "16rem" }}>
					<SelectItem value={AUTO_VALUE}>
						<span className="flex items-center gap-2">
							<span>🌐</span>
							<span>Auto — detect language</span>
						</span>
					</SelectItem>

					{voices.map(({ voice, qualityLabel, flag }) => (
						<SelectItem key={voice.voiceURI} value={voice.voiceURI}>
							<span className="flex items-center gap-2">
								<span>{flag}</span>
								<span>{voice.name}</span>
								<QualityBadge label={qualityLabel} />
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
