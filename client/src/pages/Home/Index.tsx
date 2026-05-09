import VoiceButton from "@/components/VoiceButton/Index";
import VoiceSelector from "@/components/VoiceSelector/Index";

export default function Home() {
	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center gap-4">
			<div className="absolute top-6">
				<VoiceSelector />
			</div>
			<h1 className="text-3xl font-bold tracking-tight">LinguaLocal</h1>
			<p className="text-sm text-muted-foreground">
				Click the mic and start speaking.
			</p>
			<div className="mt-8">
				<VoiceButton />
			</div>
		</main>
	);
}
