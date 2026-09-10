import { Ref } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

interface InfiniteScrollSentinelProps {
    targetRef: Ref<HTMLDivElement | null>;
    isLoadingMore: boolean;
    hasMore: boolean;
    totalReviewsCount: number;
}

export const InfiniteScrollSentinel = ({
    targetRef,
    isLoadingMore,
    hasMore,
    totalReviewsCount,
}: InfiniteScrollSentinelProps) => {
    return (
        <div
            ref={targetRef}
            className="py-4 text-center"
        >
            {isLoadingMore && (
                <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
                    <CircularProgress
                        size={20}
                        className="text-stone-600!"
                    />
                    <span>Loading more reviews...</span>
                </div>
            )}
            {!hasMore && totalReviewsCount > 0 && (
                <p className="text-xs text-stone-400 italic">
                    You have reached the end of your reviews.
                </p>
            )}
        </div>
    );
};
