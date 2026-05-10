import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export default function Pagination({
	page,
	totalPages,
	onPageChange,
}: PaginationProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => onPageChange(page - 1)}
				disabled={page <= 1}
				aria-label="Previous page"
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>

			<span className="text-sm text-muted-foreground">
				Page {page} of {totalPages}
			</span>

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => onPageChange(page + 1)}
				disabled={page >= totalPages}
				aria-label="Next page"
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	);
}
