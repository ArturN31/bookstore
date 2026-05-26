import { BookReviews } from '@/components/pages/book/Reviews/BookReviews';
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
    totalPages: 1,
    currentPage: 1,
};

const nullReviewsData = {
    data: null,
    total: 0,
    totalPages: 0,
    currentPage: 1,
};

jest.mock('@/components/pages/book/Reviews/ReviewCard/ReviewCard', () => ({
    ReviewCard: ({ review }: { review: any }) => (
        <div data-testid="review-card">{review.review}</div>
    ),
}));

jest.mock('@/components/pages/book/Reviews/ReviewPagination', () => ({
    ReviewPagination: () => <div data-testid="pagination" />,
}));

describe('APP - pages/book - BookCart - BookReviews', () => {
    it('should render reviews and pagination', () => {
        render(
            <BookReviews
                reviewsData={paginatedReviewsData}
                slug="book/1"
                page={1}
            />,
        );

        expect(screen.getByText(/\(3\) Reviews/i)).toBeInTheDocument();

        const reviewCards = screen.getAllByTestId('review-card');
        expect(reviewCards).toHaveLength(3);
        expect(screen.getByText('Review1')).toBeInTheDocument();

        expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('should return when no reviewsData supplied', () => {
        const { container } = render(
            <BookReviews
                reviewsData={nullReviewsData}
                slug="book/1"
                page={1}
            />,
        );

        expect(screen.queryByText(/Reviews/i)).not.toBeInTheDocument();
        expect(container.firstChild).toBeNull();
    });
});
