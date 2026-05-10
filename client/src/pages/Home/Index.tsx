import ConversationView from "@/components/ConversationView/Index";
import SessionSetup from "@/components/SessionSetup/Index";
import { useSessionStore } from "@/stores/session";

export default function Home() {
	const activeSession = useSessionStore((state) => state.activeSession);

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4">
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="text-3xl font-bold tracking-tight">LinguaLocal</h1>
				{!activeSession && (
					<p className="text-sm text-muted-foreground">
						Configure your session and start speaking.
					</p>
				)}
			</div>

			{activeSession ? <ConversationView /> : <SessionSetup />}
		</main>
	);
}
