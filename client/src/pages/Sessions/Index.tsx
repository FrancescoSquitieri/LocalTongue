import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDeleteAllSessions } from "@/api/session/use-delete-all-sessions";
import { useDeleteSession } from "@/api/session/use-delete-session";
import { useGetSessionLanguages } from "@/api/session/use-get-session-languages";
import { useGetSessions } from "@/api/session/use-get-sessions";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog/Index";
import Pagination from "@/components/Pagination/Index";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/helpers";
import { websocketService } from "@/services/websocket";
import { useSessionStore } from "@/stores/session";
import type { SessionResponse } from "@/types";

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
	const [page, setPage] = useState(1);
	const [selectedLanguageCode, setSelectedLanguageCode] = useState("");

	const { sessions, total, totalPages, isLoading } = useGetSessions({
		page,
		languageCode: selectedLanguageCode,
	});
	const { languages, isLoading: isLoadingLanguages } = useGetSessionLanguages();
	const { deleteAllSessions, isPending: isDeletingAll } =
		useDeleteAllSessions();

	const hasInitializedLanguage = useRef(false);

	useEffect(() => {
		if (!hasInitializedLanguage.current && languages.length > 0) {
			hasInitializedLanguage.current = true;
			setSelectedLanguageCode(languages[0].code);
		}
	}, [languages]);

	function handleLanguageChange(code: string): void {
		setSelectedLanguageCode(code === "all" ? "" : code);
		setPage(1);
	}

	function handlePageChange(newPage: number): void {
		setPage(newPage);
	}

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-8">
			<div className="mb-6 flex items-center justify-between gap-4">
				<h1 className="text-xl font-bold tracking-tight">Past Sessions</h1>
				{total > 0 && (
					<ConfirmDeleteDialog
						onConfirm={deleteAllSessions}
						isPending={isDeletingAll}
						triggerLabel="Delete All"
						title="Delete all sessions?"
						description="All sessions and their messages will be permanently deleted. This cannot be undone."
					/>
				)}
			</div>

			<div className="mb-5">
				<Select
					value={selectedLanguageCode || "all"}
					onValueChange={handleLanguageChange}
					disabled={isLoadingLanguages}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="All languages" />
					</SelectTrigger>
					<SelectContent position="popper" side="bottom" sideOffset={4}>
						<SelectItem value="all">All languages</SelectItem>
						{languages.map((lang) => (
							<SelectItem key={lang.code} value={lang.code}>
								{lang.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isLoading && <SessionsSkeleton />}

			{!isLoading && sessions.length === 0 && selectedLanguageCode === "" && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No sessions yet. Start speaking to create one.
				</p>
			)}

			{!isLoading && sessions.length === 0 && selectedLanguageCode !== "" && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No sessions for this language.
				</p>
			)}

			{!isLoading && sessions.length > 0 && (
				<div className="space-y-3">
					{sessions.map((session) => (
						<SessionCard key={session.id} session={session} />
					))}
				</div>
			)}

			<div className="mt-6">
				<Pagination
					page={page}
					totalPages={totalPages}
					onPageChange={handlePageChange}
				/>
			</div>
		</main>
	);
}
