import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuizStore } from "@/stores/quiz";
import type { QuizQuestion } from "@/types";

interface QuestionCardProps {
	question: QuizQuestion;
	questionIndex: number;
	totalQuestions: number;
}

export function QuestionCard({
	question,
	questionIndex,
	totalQuestions,
}: QuestionCardProps) {
	const selectedAnswers = useQuizStore((state) => state.selectedAnswers);
	const setAnswer = useQuizStore((state) => state.setAnswer);
	const nextQuestion = useQuizStore((state) => state.nextQuestion);

	const selectedOptionIndex = selectedAnswers[questionIndex];
	const hasAnswered = selectedOptionIndex !== undefined;
	const isLastQuestion = questionIndex === totalQuestions - 1;

	function handleSelectOption(optionIndex: number): void {
		if (hasAnswered) return;
		setAnswer(questionIndex, optionIndex);
	}

	function handleNext(): void {
		nextQuestion(totalQuestions);
	}

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<p className="text-xs text-muted-foreground">
					Question {questionIndex + 1} of {totalQuestions}
				</p>
				<p className="font-medium text-sm leading-relaxed">
					{question.question}
				</p>
			</div>

			<div className="space-y-2">
				{question.options.map((option, optionIndex) => (
					<button
						key={option}
						type="button"
						disabled={hasAnswered}
						onClick={() => handleSelectOption(optionIndex)}
						className={cn(
							"w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
							!hasAnswered && "cursor-pointer border-border hover:bg-muted/50",
							hasAnswered &&
								optionIndex === question.correctIndex &&
								"border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
							hasAnswered &&
								optionIndex === selectedOptionIndex &&
								optionIndex !== question.correctIndex &&
								"border-red-500 bg-red-500/10 text-red-700 dark:text-red-400",
							hasAnswered &&
								optionIndex !== selectedOptionIndex &&
								optionIndex !== question.correctIndex &&
								"border-border opacity-50",
							!hasAnswered && "border-border",
						)}
					>
						{option}
					</button>
				))}
			</div>

			{hasAnswered && (
				<div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
					{question.explanation}
				</div>
			)}

			{hasAnswered && (
				<Button type="button" className="w-full" onClick={handleNext}>
					{isLastQuestion ? "See Results" : "Next"}
				</Button>
			)}
		</div>
	);
}
