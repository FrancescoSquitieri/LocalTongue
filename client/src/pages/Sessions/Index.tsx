import { MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDeleteAllSessions } from "@/api/session/use-delete-all-sessions";
import { useDeleteSession } from "@/api/session/use-delete-session";
import { useGetSessions } from "@/api/session/use-get-sessions";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog/Index";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/helpers";
import { websocketService } from "@/services/websocket";
import { useSessionStore } from "@/stores/session";
import type { SessionResponse } from "@/types";

const ALL_LANGUAGES = "All";

interface SessionCardProps {
	session: SessionResponse;
}

function SessionCard({ session }: SessionCardProps) {
	const navigate = useNavigate();
	const { deleteSession, isPending: isDeleting } = useDeleteSession();

	function handleContinue(): void {
		useSessionStore.getState().setActiveSession(session);
		websocketService.initSession(session.id);
		navigate("/");
	}

	return (
		<div
			className="cursor-pointer rounded-lg border border-border bg-card transition-colors hover:bg-muted/30"
			onClick={() => navigate(`/sessions/${session.id}`)}
			onKeyDown={(event) => {
				if (event.key === "Enter") navigate(`/sessions/${session.id}`);
			}}
			role="button"
			tabIndex={0}
		>
			<div className="p-4">
				<p className="truncate text-sm font-medium">{session.title}</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					{session.language} · {session.level} · {session.topic}
				</p>
				<div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
					<span>{formatDateTime(session.createdAt)}</span>
					<span className="flex items-center gap-1">
						<MessageSquare className="h-3 w-3" />
						{session.messageCount}
					</span>
				</div>
			</div>

			<div
				className="flex gap-2 border-t border-border px-4 py-3"
				onClick={(event) => event.stopPropagation()}
			>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="flex-1"
					onClick={handleContinue}
				>
					Continue
				</Button>
				<ConfirmDeleteDialog
					onConfirm={() => deleteSession(session.id)}
					isPending={isDeleting}
					title="Delete session?"
					description="All messages in this session will be permanently deleted."
				/>
			</div>
		</div>
	);
}

interface LanguageFilterProps {
	languages: string[];
	selected: string;
	onSelect: (language: string) => void;
}

function LanguageFilter({
	languages,
	selected,
	onSelect,
}: LanguageFilterProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{[ALL_LANGUAGES, ...languages].map((language) => (
				<button
					key={language}
					type="button"
					onClick={() => onSelect(language)}
					className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
						selected === language
							? "border-primary bg-primary text-primary-foreground"
							: "border-border bg-transparent text-muted-foreground hover:bg-muted"
					}`}
				>
					{language}
				</button>
			))}
		</div>
	);
}

function SessionsSkeleton() {
	return (
		<div className="space-y-3">
			{[1, 2, 3].map((index) => (
				<div
					key={index}
					className="h-28 animate-pulse rounded-lg border border-border bg-muted/40"
				/>
			))}
		</div>
	);
}

export default function Sessions() {
	const { sessions, isLoading } = useGetSessions();
	const { deleteAllSessions, isPending: isDeletingAll } =
		useDeleteAllSessions();
	const [selectedLanguage, setSelectedLanguage] = useState(ALL_LANGUAGES);

	const availableLanguages = useMemo(
		() => [...new Set(sessions.map((session) => session.language))].sort(),
		[sessions],
	);

	const filteredSessions = useMemo(
		() =>
			selectedLanguage === ALL_LANGUAGES
				? sessions
				: sessions.filter((session) => session.language === selectedLanguage),
		[sessions, selectedLanguage],
	);

	function handleLanguageSelect(language: string): void {
		setSelectedLanguage(language);
	}

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-8">
			<div className="mb-6 flex items-center justify-between gap-4">
				<h1 className="text-xl font-bold tracking-tight">Past Sessions</h1>
				{sessions.length > 0 && (
					<ConfirmDeleteDialog
						onConfirm={deleteAllSessions}
						isPending={isDeletingAll}
						triggerLabel="Delete All"
						title="Delete all sessions?"
						description="All sessions and their messages will be permanently deleted. This cannot be undone."
					/>
				)}
			</div>

			{!isLoading && availableLanguages.length > 1 && (
				<div className="mb-5">
					<LanguageFilter
						languages={availableLanguages}
						selected={selectedLanguage}
						onSelect={handleLanguageSelect}
					/>
				</div>
			)}

			{isLoading && <SessionsSkeleton />}

			{!isLoading && sessions.length === 0 && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No sessions yet. Start speaking to create one.
				</p>
			)}

			{!isLoading && filteredSessions.length === 0 && sessions.length > 0 && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No sessions for this language.
				</p>
			)}

			{!isLoading && filteredSessions.length > 0 && (
				<div className="space-y-3">
					{filteredSessions.map((session) => (
						<SessionCard key={session.id} session={session} />
					))}
				</div>
			)}
		</main>
	);
}
