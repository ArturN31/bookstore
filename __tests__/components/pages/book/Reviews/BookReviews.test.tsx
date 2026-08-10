import { BookReviews } from '@/components/pages/book/Reviews/BookReviews';
import { screen, render } from '@testing-library/react';

interface Review {
    id: string;
    created_at: string;
    updated_at: string;
    book_id: string;
    user_id: string;
    review: string;
    rating: number;
    username: string;
}

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

const emptyReviewsData = {
    data: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
};

jest.mock('@/components/pages/book/Reviews/ReviewCard/ReviewCard', () => ({
    ReviewCard: ({ review }: { review: Review }) => (
        <div data-testid="review-card">{review.review}</div>
    ),
}));

jest.mock('@/components/pages/book/Reviews/ReviewPagination', () => ({
    ReviewPagination: () => <div data-testid="pagination" />,
}));

jest.mock('@/components/pages/book/Reviews/ReviewForm/ReviewFormModal', () => ({
    ReviewFormModal: () => <div data-testid="review-form-modal" />,
}));

describe('APP - pages/book - BookCart - BookReviews', () => {
    it('should render reviews and pagination', () => {
        render(
            <BookReviews
                reviewsData={paginatedReviewsData}
                bookId="1"
                slug="book/1"
                page={1}
            />,
        );

        expect(screen.getByText(/3 reviews/i)).toBeInTheDocument();

        const reviewCards = screen.getAllByTestId('review-card');
        expect(reviewCards).toHaveLength(3);
        expect(screen.getByText('Review1')).toBeInTheDocument();

        expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('should render empty state when no reviewsData supplied', () => {
        render(
            <BookReviews
                reviewsData={emptyReviewsData}
                bookId="1"
                slug="book/1"
                page={1}
            />,
        );

        expect(screen.getByText(/0 reviews/i)).toBeInTheDocument();
        expect(
            screen.getByText(/No reviews yet. Be the first to review this book!/i),
        ).toBeInTheDocument();
    });

    it('should handle nullish data in reviewsData via fallback', () => {
        const nullishData = {
            data: null,
            total: 0,
            totalPages: 0,
            currentPage: 1,
        } as unknown as Parameters<typeof BookReviews>[0]['reviewsData'];

        render(
            <BookReviews
                reviewsData={nullishData}
                bookId="1"
                slug="book/1"
                page={1}
            />,
        );

        expect(screen.getByText(/0 reviews/i)).toBeInTheDocument();
        expect(
            screen.getByText(/No reviews yet. Be the first to review this book!/i),
        ).toBeInTheDocument();
    });
});
