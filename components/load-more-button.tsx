'use client';

import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface LoadMoreButtonProps {
    onLoadMore: () => void;
    isLoading: boolean;
    currentCount: number;
    totalCount: number;
    hasMore: boolean;
}

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

    return (
        <div className="flex flex-col items-center gap-2 py-4">
            {/* TODO : Fix things */}
            {/* <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            Load More ({currentCount} of {totalCount})
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Showing {currentCount} of {totalCount} results
      </p> */}
        </div>
    );
}
