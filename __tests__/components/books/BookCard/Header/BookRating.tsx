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
    it('should render component with badge variant', () => {
        render(<BookRating reviews={mockedReviews} />);

        expect(screen.getByText('3.7')).toBeInTheDocument();
    });

    it('should render nothing when there are no reviews', () => {
        const { container } = render(<BookRating reviews={[]} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render default variant with progress bar', () => {
        const { container } = render(<BookRating reviews={mockedReviews} variant="default" />);

        expect(screen.getByText('3.7')).toBeInTheDocument();
        expect(screen.getByText('Rating')).toBeInTheDocument();
        // Check for the progress bar element (yellow bar)
        const progressBar = container.querySelector('.bg-\\[\\#facc15\\]');
        expect(progressBar).toBeInTheDocument();
        // Check for the background bar (slate-100)
        const backgroundBar = container.querySelector('.bg-slate-100');
        expect(backgroundBar).toBeInTheDocument();
    });
});
