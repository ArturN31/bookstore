import { ReviewPagination } from '@/components/pages/book/Reviews/ReviewPagination';
import { screen, render } from '@testing-library/react';

const reviewsData: Review[] = [
    {
        id: '1',
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
        book_id: '1',
        user_id: '1',
        review: 'Review1',
        rating: 5,
        username: 'User1',
    },
    {
        id: '2',
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
        book_id: '1',
        user_id: '2',
        review: 'Review2',
        rating: 4,
        username: 'User2',
    },
    {
        id: '3',
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
        book_id: '1',
        user_id: '3',
        review: 'Review3',
        rating: 3,
        username: 'User3',
    },
];

const paginatedReviewsData = {
    data: reviewsData,
    total: 3,
    totalPages: 5,
    currentPage: 1,
};

const nullReviewsData = {
    data: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
};

describe('APP - pages/book - BookCart - ReviewsPagination', () => {
    it('should return null when (!reviewsData?.totalPages || reviewsData.totalPages <= 1)', () => {
        const { container } = render(
            <ReviewPagination
                reviewsData={nullReviewsData}
                slug="1"
                page={1}
            />,
        );

        expect(container.firstChild).toBeNull();
    });

    it('should return component', () => {
        const { container } = render(
            <ReviewPagination
                reviewsData={paginatedReviewsData}
                slug="1"
                page={1}
            />,
        );

        expect(container.getElementsByTagName('a').length).toBe(7);
    });

    it('should have the correct href on the Next and Previous buttons', () => {
        render(
            <ReviewPagination
                reviewsData={paginatedReviewsData}
                slug="1"
                page={1}
            />,
        );

        const nextLink = screen.getByRole('link', { name: /next/i });
        const prevLink = screen.getByRole('link', { name: /prev/i });

        expect(nextLink).toHaveAttribute('href', expect.stringContaining('reviewPagination=2'));
        expect(prevLink).toHaveClass('pointer-events-none');
    });

    it('should handle middle page logic correctly', () => {
        render(
            <ReviewPagination
                reviewsData={{ ...paginatedReviewsData, currentPage: 3 }}
                slug="1"
                page={3}
            />,
        );

        const nextLink = screen.getByRole('link', { name: /next/i });
        const prevLink = screen.getByRole('link', { name: /prev/i });

        expect(nextLink).toHaveAttribute('href', expect.stringContaining('reviewPagination=4'));
        expect(prevLink).toHaveAttribute('href', expect.stringContaining('reviewPagination=2'));
    });

    it('should handle edge case: last page logic', () => {
        render(
            <ReviewPagination
                reviewsData={paginatedReviewsData}
                slug="1"
                page={5}
            />,
        );

        const nextLink = screen.getByRole('link', { name: /next/i });
        expect(nextLink).toHaveClass('pointer-events-none');
    });
});
