import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { useGetQuiz } from "@/api/quiz/use-get-quiz";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/stores/quiz";

import { QuestionCard } from "./QuestionCard";
import { ResultsView } from "./ResultsView";

function QuizDetailSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-6 w-48 animate-pulse rounded bg-muted/60" />
			<div className="space-y-2">
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

export default function QuizDetail() {
	const { id } = useParams<{ id: string }>();

	const { quiz, isLoading } = useGetQuiz(id);

	const currentQuestionIndex = useQuizStore(
		(state) => state.currentQuestionIndex,
	);
	const selectedAnswers = useQuizStore((state) => state.selectedAnswers);
	const isFinished = useQuizStore((state) => state.isFinished);
	const resetQuiz = useQuizStore((state) => state.resetQuiz);

	useEffect(() => {
		resetQuiz();
	}, [resetQuiz]);

	const currentQuestion = quiz?.questions[currentQuestionIndex];

	return (
		<main className="mx-auto min-h-screen max-w-lg px-4 py-8">
			<div className="mb-6 flex items-center gap-3">
				<Link to="/quiz">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Back to quizzes"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
				</Link>
				<h1 className="text-xl font-bold tracking-tight">
					{quiz?.title ?? "Quiz"}
				</h1>
			</div>

			{isLoading && <QuizDetailSkeleton />}

			{!isLoading && quiz && !isFinished && currentQuestion && (
				<QuestionCard
					question={currentQuestion}
					questionIndex={currentQuestionIndex}
					totalQuestions={quiz.questions.length}
				/>
			)}

			{!isLoading && quiz && isFinished && (
				<ResultsView
					questions={quiz.questions}
					selectedAnswers={selectedAnswers}
					onRetry={resetQuiz}
				/>
			)}
		</main>
	);
}
