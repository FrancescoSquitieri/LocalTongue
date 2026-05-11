import { ArrowLeft, GraduationCap, Play } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreateQuiz } from "@/api/quiz/use-create-quiz";
import { useGetSession } from "@/api/session/use-get-session";
import { Button } from "@/components/ui/button";
import { websocketService } from "@/services/websocket";
import { useSessionStore } from "@/stores/session";

import { MessageBubble } from "./MessageBubble";

function SessionDetailSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-6 w-48 animate-pulse rounded bg-muted/60" />
			<div className="h-4 w-64 animate-pulse rounded bg-muted/40" />
			<div className="mt-6 space-y-3">
				{[1, 2, 3, 4].map((index) => (
					<div
						key={index}
						className="h-12 animate-pulse rounded-lg bg-muted/40"
					/>
				))}
			</div>
		</div>
	);
}

export default function SessionDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const { data, isLoading } = useGetSession(id);
	const {
		createQuiz,
		isPending: isCreatingQuiz,
		data: newQuiz,
	} = useCreateQuiz();

	useEffect(() => {
		if (newQuiz) {
			navigate(`/quiz/${newQuiz.id}`);
		}
	}, [newQuiz, navigate]);

	function handleContinue(): void {
		if (!data) return;
		useSessionStore.getState().setActiveSession(data.session);
		websocketService.initSession(data.session.id);
		navigate("/");
	}

	function handleGenerateQuiz(): void {
		if (!data) return;
		createQuiz({
			sessionIds: [data.session.id],
			language: data.session.language,
			languageCode: data.session.languageCode,
			level: data.session.level,
		});
	}

	const formattedDate = data
		? new Date(data.session.createdAt).toLocaleString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: "";

	return (
		<main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
			<div className="mb-6 flex items-center gap-3">
				<Link to="/sessions">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Back to sessions"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<h1 className="text-xl font-bold tracking-tight">Session Detail</h1>
			</div>

			{isLoading && <SessionDetailSkeleton />}

			{!isLoading && data && (
				<>
					<div className="mb-6 space-y-1">
						<p className="font-semibold">{data.session.title}</p>
						<p className="text-xs text-muted-foreground">
							{data.session.language} · {data.session.level} ·{" "}
							{data.session.topic} · {formattedDate}
						</p>
					</div>

					<div className="mb-6 max-h-[60vh] overflow-y-auto space-y-5 rounded-lg border border-border p-3">
						{data.messages.length === 0 ? (
							<p className="py-4 text-center text-sm text-muted-foreground">
								No messages yet.
							</p>
						) : (
							data.messages.map((message) => (
								<MessageBubble key={message.id} message={message} />
							))
						)}
					</div>

					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={handleContinue}
						>
							<Play className="h-3.5 w-3.5" />
							Continue Conversation
						</Button>
						<Button
							type="button"
							className="flex-1"
							disabled={isCreatingQuiz}
							onClick={handleGenerateQuiz}
						>
							<GraduationCap className="h-3.5 w-3.5" />
							{isCreatingQuiz ? "Generating…" : "Generate Quiz"}
						</Button>
					</div>
				</>
			)}
		</main>
	);
}
