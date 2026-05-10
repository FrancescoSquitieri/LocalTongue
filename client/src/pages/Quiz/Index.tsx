import { GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useDeleteQuiz } from "@/api/quiz/use-delete-quiz";
import { useGetQuizzes } from "@/api/quiz/use-get-quizzes";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog/Index";
import { formatDateTime } from "@/lib/helpers";
import type { QuizResponse } from "@/types";

interface QuizCardProps {
	quiz: QuizResponse;
}

function QuizCard({ quiz }: QuizCardProps) {
	const navigate = useNavigate();
	const { deleteQuiz, isPending: isDeleting } = useDeleteQuiz();

	return (
		<div
			className="cursor-pointer rounded-lg border border-border bg-card transition-colors hover:bg-muted/30"
			onClick={() => navigate(`/quiz/${quiz.id}`)}
			onKeyDown={(event) => {
				if (event.key === "Enter") navigate(`/quiz/${quiz.id}`);
			}}
			role="button"
			tabIndex={0}
		>
			<div className="p-4">
				<p className="truncate text-sm font-medium">{quiz.title}</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					{quiz.language} · {quiz.level}
				</p>
				<div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
					<span>{formatDateTime(quiz.createdAt)}</span>
					<span className="flex items-center gap-1">
						<GraduationCap className="h-3 w-3" />
						{quiz.questions.length} questions
					</span>
				</div>
			</div>

			<div
				className="flex justify-end border-t border-border px-4 py-3"
				onClick={(event) => event.stopPropagation()}
			>
				<ConfirmDeleteDialog
					onConfirm={() => deleteQuiz(quiz.id)}
					isPending={isDeleting}
					title="Delete quiz?"
					description="This quiz and all its questions will be permanently deleted."
				/>
			</div>
		</div>
	);
}

function QuizzesSkeleton() {
	return (
		<div className="space-y-3">
			{[1, 2, 3].map((index) => (
				<div
					key={index}
					className="h-24 animate-pulse rounded-lg border border-border bg-muted/40"
				/>
			))}
		</div>
	);
}

export default function Quiz() {
	const { quizzes, isLoading } = useGetQuizzes();

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-8">
			<h1 className="mb-6 text-xl font-bold tracking-tight">Quizzes</h1>

			{isLoading && <QuizzesSkeleton />}

			{!isLoading && quizzes.length === 0 && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No quizzes yet. Generate one from a session.
				</p>
			)}

			{!isLoading && quizzes.length > 0 && (
				<div className="space-y-3">
					{quizzes.map((quiz) => (
						<QuizCard key={quiz.id} quiz={quiz} />
					))}
				</div>
			)}
		</main>
	);
}
