import { ReviewSummary } from '@/components/pages/book/Reviews/ReviewSummary';
import { render, screen } from '@testing-library/react';

describe('ReviewSummary', () => {
    it('should render singular review label when reviewsCount is 1', () => {
        render(
            <ReviewSummary
                reviewsCount={1}
                averageRating={4.5}
            />,
        );

        expect(screen.getByText('(1 Review)')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should render plural reviews label when reviewsCount is greater than 1', () => {
        render(
            <ReviewSummary
                reviewsCount={3}
                averageRating={4.0}
            />,
        );

        expect(screen.getByText('(3 Reviews)')).toBeInTheDocument();
        expect(screen.getByText('4.0')).toBeInTheDocument();
    });

    it('should handle zero reviews and NaN average rating safely', () => {
        render(
            <ReviewSummary
                reviewsCount={0}
                averageRating={NaN}
            />,
        );

        expect(screen.getByText('(0 Reviews)')).toBeInTheDocument();
        expect(screen.getByText('0.0')).toBeInTheDocument();
    });
});
