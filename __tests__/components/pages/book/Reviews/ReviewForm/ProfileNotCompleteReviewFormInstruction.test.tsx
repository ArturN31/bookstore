import { ProfileNotCompletedReviewFormInstruction } from '@/components/pages/book/Reviews/ReviewForm/ProfileNotCompletedReviewFormInstruction';
import { render, screen } from '@testing-library/react';

describe('ProfileNotCompletedReviewFormInstruction', () => {
    it('should render complete your profile link with correct href and text', () => {
        render(<ProfileNotCompletedReviewFormInstruction />);

        const profileLink = screen.getByRole('link', { name: /complete your profile/i });
        expect(profileLink).toBeInTheDocument();
        expect(profileLink).toHaveAttribute('href', '/user/profile');

        expect(screen.getByText(/please/i)).toBeInTheDocument();
        expect(screen.getByText(/to leave a review\./i)).toBeInTheDocument();
    });
});
