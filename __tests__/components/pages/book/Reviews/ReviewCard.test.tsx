import { ReviewCard } from '@/components/pages/book/Reviews/ReviewCard/ReviewCard';
import { screen, render } from '@testing-library/react';

const mockedReview = {
    id: '1',
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
    book_id: '1',
    user_id: '1',
    review: 'Review1',
    rating: 5,
    username: 'User1',
};

describe('APP - pages/book - BookCart - ReviewCard', () => {
    const renderAsyncCard = async (review: Review) => {
        const ResolvedComponent = await ReviewCard({ review });
        return render(ResolvedComponent);
    };

    it('should render component with base review data', async () => {
        await renderAsyncCard(mockedReview);

        expect(screen.getByText(mockedReview.username)).toBeInTheDocument();
        expect(screen.getByText('01/01/2023')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(mockedReview.review)).toBeInTheDocument();
    });

    it('should render the edited label when updated_at is different', async () => {
        const updatedReview = {
            ...mockedReview,
            updated_at: '2023-01-02T12:00:00Z',
        };

        await renderAsyncCard(updatedReview);

        expect(screen.getByText(/\(Edited\)/i)).toBeInTheDocument();
    });

    it('should apply correct star colors based on rating', async () => {
        const rating = 3;
        const reviewWithMidRating = {
            ...mockedReview,
            rating: rating,
        };

        const { container } = await renderAsyncCard(reviewWithMidRating);

        const stars = container.querySelectorAll('svg[data-testid="StarRateIcon"]');

        expect(stars).toHaveLength(5);

        stars.forEach((star, index) => {
            if (index < rating) {
                expect(star).toHaveClass('text-yellow-500');
                expect(star).not.toHaveClass('text-gray-200');
            } else {
                expect(star).toHaveClass('text-gray-200');
                expect(star).not.toHaveClass('text-yellow-500');
            }
        });
    });
});
