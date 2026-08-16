import { InfiniteScrollSentinel } from '@/app/user/content/reviews/components/InfiniteScrollSentinel';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';

describe('InfiniteScrollSentinel', () => {
    it('should attach targetRef to the root div element', () => {
        const targetRef = createRef<HTMLDivElement>();
        render(
            <InfiniteScrollSentinel
                targetRef={targetRef}
                isLoadingMore={false}
                hasMore={true}
                totalReviewsCount={0}
            />,
        );

        expect(targetRef.current).toBeInTheDocument();
        expect(targetRef.current?.tagName).toBe('DIV');
    });

    it('should show loading indicator and text when isLoadingMore is true', () => {
        const targetRef = createRef<HTMLDivElement>();
        render(
            <InfiniteScrollSentinel
                targetRef={targetRef}
                isLoadingMore={true}
                hasMore={true}
                totalReviewsCount={5}
            />,
        );

        expect(screen.getByText('Loading more reviews...')).toBeInTheDocument();
    });

    it('should not show loading state when isLoadingMore is false', () => {
        const targetRef = createRef<HTMLDivElement>();
        render(
            <InfiniteScrollSentinel
                targetRef={targetRef}
                isLoadingMore={false}
                hasMore={true}
                totalReviewsCount={5}
            />,
        );

        expect(screen.queryByText('Loading more reviews...')).not.toBeInTheDocument();
    });

    it('should show end of reviews message when hasMore is false and totalReviewsCount is greater than 0', () => {
        const targetRef = createRef<HTMLDivElement>();
        render(
            <InfiniteScrollSentinel
                targetRef={targetRef}
                isLoadingMore={false}
                hasMore={false}
                totalReviewsCount={10}
            />,
        );

        expect(screen.getByText('You have reached the end of your reviews.')).toBeInTheDocument();
    });

    it('should not show end of reviews message when hasMore is false but totalReviewsCount is 0', () => {
        const targetRef = createRef<HTMLDivElement>();
        render(
            <InfiniteScrollSentinel
                targetRef={targetRef}
                isLoadingMore={false}
                hasMore={false}
                totalReviewsCount={0}
            />,
        );

        expect(
            screen.queryByText('You have reached the end of your reviews.'),
        ).not.toBeInTheDocument();
    });

    it('should not show end of reviews message when hasMore is true', () => {
        const targetRef = createRef<HTMLDivElement>();
        render(
            <InfiniteScrollSentinel
                targetRef={targetRef}
                isLoadingMore={false}
                hasMore={true}
                totalReviewsCount={10}
            />,
        );

        expect(
            screen.queryByText('You have reached the end of your reviews.'),
        ).not.toBeInTheDocument();
    });
});
