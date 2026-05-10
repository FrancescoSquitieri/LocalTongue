import { Trash2 } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDeleteDialogProps {
	onConfirm: () => void;
	isPending?: boolean;
	title?: string;
	description?: string;
	/** When provided renders a text button instead of the default icon-only button. */
	triggerLabel?: string;
}

export function ConfirmDeleteDialog({
	onConfirm,
	isPending = false,
	title = "Are you sure?",
	description = "This action cannot be undone.",
	triggerLabel,
}: ConfirmDeleteDialogProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					type="button"
					variant="destructive"
					disabled={isPending}
					aria-label={triggerLabel ?? "Delete"}
					onClick={(event) => event.stopPropagation()}
					className={cn(triggerLabel ? "gap-2 px-3 text-sm" : "h-8 w-8 p-0")}
				>
					<Trash2 className="h-3.5 w-3.5 shrink-0" />
					{triggerLabel && <span>{triggerLabel}</span>}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
