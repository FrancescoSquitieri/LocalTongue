import { GraduationCap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDeleteAllQuizzes } from "@/api/quiz/use-delete-all-quizzes";
import { useDeleteQuiz } from "@/api/quiz/use-delete-quiz";
import { useGetQuizLanguages } from "@/api/quiz/use-get-quiz-languages";
import { useGetQuizzes } from "@/api/quiz/use-get-quizzes";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog/Index";
import Pagination from "@/components/Pagination/Index";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	const [page, setPage] = useState(1);
	const [selectedLanguageCode, setSelectedLanguageCode] = useState("");

	const { quizzes, total, totalPages, isLoading } = useGetQuizzes({
		page,
		languageCode: selectedLanguageCode,
	});
	const { languages, isLoading: isLoadingLanguages } = useGetQuizLanguages();
	const { deleteAllQuizzes, isPending: isDeletingAll } = useDeleteAllQuizzes();

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
				<h1 className="text-xl font-bold tracking-tight">Quizzes</h1>
				{total > 0 && (
					<ConfirmDeleteDialog
						onConfirm={deleteAllQuizzes}
						isPending={isDeletingAll}
						triggerLabel="Delete All"
						title="Delete all quizzes?"
						description="All quizzes will be permanently deleted. This cannot be undone."
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

			{isLoading && <QuizzesSkeleton />}

			{!isLoading && quizzes.length === 0 && selectedLanguageCode === "" && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No quizzes yet. Generate one from a session.
				</p>
			)}

			{!isLoading && quizzes.length === 0 && selectedLanguageCode !== "" && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No quizzes for this language.
				</p>
			)}

			{!isLoading && quizzes.length > 0 && (
				<div className="space-y-3">
					{quizzes.map((quiz) => (
						<QuizCard key={quiz.id} quiz={quiz} />
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
