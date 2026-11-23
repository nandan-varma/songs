import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadMoreButtonProps {
	hasNextPage: boolean;
	isFetching: boolean;
	onLoadMore: () => void;
}

export function LoadMoreButton({
	hasNextPage,
	isFetching,
	onLoadMore,
}: LoadMoreButtonProps) {
	if (!hasNextPage) return null;

	return (
		<div className="flex justify-center pt-4">
			<Button variant="outline" onClick={onLoadMore} disabled={isFetching}>
				{isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
				Load more
			</Button>
		</div>
	);
}
