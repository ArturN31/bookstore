import { BookRating } from '@/components/books/bookCard/Header/BookRating';
import { render, screen } from '@testing-library/react';

const mockedReviews: Review[] = [
    {
        id: '1',
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
        book_id: '1',
        user_id: '1',
        review: 'review1',
        rating: 2,
        username: 'user1',
    },
    {
        id: '2',
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
        book_id: '1',
        user_id: '2',
        review: 'review2',
        rating: 5,
        username: 'user1',
    },
    {
        id: '3',
        created_at: new Date().toUTCString(),
        updated_at: new Date().toUTCString(),
        book_id: '1',
        user_id: '3',
        review: 'review3',
        rating: 4,
        username: 'user1',
    },
];

describe('APP - BookCard - Rating', () => {
    it('should render component', () => {
        render(<BookRating reviews={mockedReviews} />);

        expect(screen.getByTestId(`book-rating-${mockedReviews[0].book_id}`)).toHaveTextContent(
            '3.67',
        );
    });

    it('should render 0.00 when there are no reviews', () => {
        render(<BookRating reviews={[]} />);

        const ratingElement = screen.getByTestId('book-rating-empty');
        expect(ratingElement).toHaveTextContent('0.00');
    });
});
