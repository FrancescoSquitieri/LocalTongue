import { GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDeleteAllQuizzes } from "@/api/quiz/use-delete-all-quizzes";
import { useDeleteQuiz } from "@/api/quiz/use-delete-quiz";
import { useGetQuizzes } from "@/api/quiz/use-get-quizzes";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog/Index";
import { formatDateTime } from "@/lib/helpers";
import type { QuizResponse } from "@/types";

const ALL_LANGUAGES = "All";

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
	const { deleteAllQuizzes, isPending: isDeletingAll } = useDeleteAllQuizzes();
	const [selectedLanguage, setSelectedLanguage] = useState(ALL_LANGUAGES);

	const availableLanguages = useMemo(
		() => [...new Set(quizzes.map((quiz) => quiz.language))].sort(),
		[quizzes],
	);

	const filteredQuizzes = useMemo(
		() =>
			selectedLanguage === ALL_LANGUAGES
				? quizzes
				: quizzes.filter((quiz) => quiz.language === selectedLanguage),
		[quizzes, selectedLanguage],
	);

	function handleLanguageSelect(language: string): void {
		setSelectedLanguage(language);
	}

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-8">
			<div className="mb-6 flex items-center justify-between gap-4">
				<h1 className="text-xl font-bold tracking-tight">Quizzes</h1>
				{quizzes.length > 0 && (
					<ConfirmDeleteDialog
						onConfirm={deleteAllQuizzes}
						isPending={isDeletingAll}
						triggerLabel="Delete All"
						title="Delete all quizzes?"
						description="All quizzes will be permanently deleted. This cannot be undone."
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

			{isLoading && <QuizzesSkeleton />}

			{!isLoading && quizzes.length === 0 && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No quizzes yet. Generate one from a session.
				</p>
			)}

			{!isLoading && filteredQuizzes.length === 0 && quizzes.length > 0 && (
				<p className="py-12 text-center text-sm text-muted-foreground">
					No quizzes for this language.
				</p>
			)}

			{!isLoading && filteredQuizzes.length > 0 && (
				<div className="space-y-3">
					{filteredQuizzes.map((quiz) => (
						<QuizCard key={quiz.id} quiz={quiz} />
					))}
				</div>
			)}
		</main>
	);
}
