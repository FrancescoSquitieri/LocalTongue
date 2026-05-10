import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { VoiceInfo } from "@/lib/voiceSelector";
import { getAllVoicesWithInfo, getVoiceSearchText } from "@/lib/voiceSelector";
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
	const [searchQuery, setSearchQuery] = useState("");
	const searchInputRef = useRef<HTMLInputElement>(null);

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

	const normalizedQuery = searchQuery.trim().toLowerCase();

	const filteredVoices =
		normalizedQuery === ""
			? voices
			: voices.filter(({ voice }) =>
					getVoiceSearchText(voice).includes(normalizedQuery),
				);

	const selectedValue = preferredVoiceURI ?? AUTO_VALUE;

	function handleValueChange(value: string) {
		setPreferredVoiceURI(value === AUTO_VALUE ? null : value);
	}

	function handleOpenChange(open: boolean) {
		if (!open) {
			setSearchQuery("");
			return;
		}
		// Radix focuses the selected item first — defer to let it finish,
		// then move focus to the search input.
		setTimeout(() => {
			searchInputRef.current?.focus();
		}, 50);
	}

	const searchBox = (
		<div className="flex items-center gap-2 px-2.5 py-2">
			<Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
			<input
				ref={searchInputRef}
				type="text"
				value={searchQuery}
				onChange={(event) => setSearchQuery(event.target.value)}
				// Prevent Radix from intercepting keystrokes for its own type-ahead.
				onKeyDown={(event) => event.stopPropagation()}
				placeholder="Search by name or language…"
				className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
			/>
		</div>
	);

	return (
		<div className="flex flex-col items-center gap-1.5">
			<span className="text-xs font-medium text-muted-foreground">
				Response voice
			</span>
			<Select
				value={selectedValue}
				onValueChange={handleValueChange}
				onOpenChange={handleOpenChange}
			>
				<SelectTrigger className="w-72 text-sm">
					<SelectValue placeholder="Auto (detect language)" />
				</SelectTrigger>
				<SelectContent
					position="popper"
					style={{ maxHeight: "16rem" }}
					header={searchBox}
				>
					{normalizedQuery === "" && (
						<SelectItem value={AUTO_VALUE}>
							<span className="flex items-center gap-2">
								<span>🌐</span>
								<span>Auto — detect language</span>
							</span>
						</SelectItem>
					)}

					{filteredVoices.map(({ voice, qualityLabel, flag }) => (
						<SelectItem key={voice.voiceURI} value={voice.voiceURI}>
							<span className="flex items-center gap-2">
								<span>{flag}</span>
								<span>{voice.name}</span>
								<QualityBadge label={qualityLabel} />
							</span>
						</SelectItem>
					))}

					{filteredVoices.length === 0 && (
						<div className="py-4 text-center text-xs text-muted-foreground">
							No voices found.
						</div>
					)}
				</SelectContent>
			</Select>
		</div>
	);
}
