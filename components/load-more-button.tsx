'use client';

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isLoading: boolean;
  currentCount: number;
  totalCount: number;
  hasMore: boolean;
}


// TODO : Implement the Load More Button UI and functionality
export function LoadMoreButton({
  onLoadMore,
  isLoading,
  currentCount,
  totalCount,
  hasMore,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return (

      <div className="text-center py-4 text-sm text-muted-foreground">
        All results loaded ({currentCount} of {totalCount})
      </div>
    );
  }

  return null;
}
