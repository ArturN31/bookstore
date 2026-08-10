import { ReviewCard } from '@/components/pages/book/Reviews/ReviewCard/ReviewCard';
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

const mockedReview: Review = {
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

        expect(screen.getByText(/User1/)).toBeInTheDocument();
        expect(screen.getByText(/0?1\/0?1\/2023/)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(mockedReview.review)).toBeInTheDocument();
    });

    it('should render the edited label when updated_at is different', async () => {
        const updatedReview: Review = {
            ...mockedReview,
            updated_at: '2023-01-02T12:00:00Z',
        };

        await renderAsyncCard(updatedReview);

        expect(screen.getByText(/\(Edited\)/i)).toBeInTheDocument();
    });

    it('should render the correct rating value and star icons', async () => {
        const rating = 3;
        const reviewWithMidRating: Review = {
            ...mockedReview,
            rating: rating,
        };

        const { container } = await renderAsyncCard(reviewWithMidRating);

        expect(screen.getByText('3')).toBeInTheDocument();
        const stars = container.querySelectorAll('svg[data-testid="StarIcon"]');
        expect(stars.length).toBeGreaterThan(0);
    });
});
