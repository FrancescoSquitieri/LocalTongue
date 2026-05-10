import { useState } from "react";

import { useCreateSession } from "@/api/session/use-create-session";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

import { LanguageSelector } from "./LanguageSelector";
import { LevelSelector } from "./LevelSelector";
import { TopicSelector } from "./TopicSelector";

export default function SessionSetup() {
	const [selectedLanguageCode, setSelectedLanguageCode] = useState("");
	const [selectedLevel, setSelectedLevel] = useState("");
	const [selectedTopic, setSelectedTopic] = useState("");

	const { createSession, isPending } = useCreateSession();

	const isFormComplete =
		selectedLanguageCode !== "" && selectedLevel !== "" && selectedTopic !== "";

	function handleStartSession(): void {
		if (!isFormComplete) return;

		const language = SUPPORTED_LANGUAGES.find(
			(lang) => lang.code === selectedLanguageCode,
		);
		if (!language) return;

		createSession({
			language: language.name,
			languageCode: selectedLanguageCode,
			level: selectedLevel,
			topic: selectedTopic,
		});
	}

	return (
		<div className="w-full max-w-sm space-y-6">
			<div className="space-y-4">
				<LanguageSelector
					value={selectedLanguageCode}
					onChange={setSelectedLanguageCode}
				/>
				<LevelSelector value={selectedLevel} onChange={setSelectedLevel} />
				<TopicSelector value={selectedTopic} onChange={setSelectedTopic} />
			</div>

			<Button
				type="button"
				className="w-full"
				disabled={!isFormComplete || isPending}
				onClick={handleStartSession}
			>
				{isPending ? "Starting…" : "Start Session"}
			</Button>
		</div>
	);
}
