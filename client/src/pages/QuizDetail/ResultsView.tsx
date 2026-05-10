import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

interface ResultQuestionRowProps {
	question: QuizQuestion;
	questionIndex: number;
	selectedAnswers: Record<number, number>;
}

function ResultQuestionRow({
	question,
	questionIndex,
	selectedAnswers,
}: ResultQuestionRowProps) {
	const selectedOptionIndex = selectedAnswers[questionIndex];
	const isCorrect = selectedOptionIndex === question.correctIndex;

	return (
		<div className="space-y-1.5 rounded-lg border border-border p-3">
			<p className="text-xs font-medium">{question.question}</p>
			<p
				className={cn(
					"text-xs",
					isCorrect
						? "text-green-600 dark:text-green-400"
						: "text-red-600 dark:text-red-400",
				)}
			>
				Your answer:{" "}
				{selectedOptionIndex !== undefined
					? question.options[selectedOptionIndex]
					: "Not answered"}
				{isCorrect ? " ✓" : " ✗"}
			</p>
			{!isCorrect && (
				<p className="text-xs text-green-600 dark:text-green-400">
					Correct: {question.options[question.correctIndex]}
				</p>
			)}
			<p className="text-xs text-muted-foreground">{question.explanation}</p>
		</div>
	);
}

interface ResultsViewProps {
	questions: QuizQuestion[];
	selectedAnswers: Record<number, number>;
	onRetry: () => void;
}

export function ResultsView({
	questions,
	selectedAnswers,
	onRetry,
}: ResultsViewProps) {
	const correctCount = questions.filter(
		(_question, index) =>
			selectedAnswers[index] === questions[index].correctIndex,
	).length;

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
				<p className="text-2xl font-bold">
					{correctCount}/{questions.length}
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					{correctCount === questions.length
						? "Perfect score! 🎉"
						: correctCount >= questions.length / 2
							? "Good effort! Keep practicing."
							: "Keep studying — you'll get it!"}
				</p>
			</div>

			<div className="space-y-2">
				{questions.map((question, index) => (
					<ResultQuestionRow
						key={question.question}
						question={question}
						questionIndex={index}
						selectedAnswers={selectedAnswers}
					/>
				))}
			</div>

			<button
				type="button"
				onClick={onRetry}
				className="w-full rounded-lg border border-border py-2 text-sm font-medium transition-colors hover:bg-muted/50"
			>
				Try Again
			</button>
		</div>
	);
}
