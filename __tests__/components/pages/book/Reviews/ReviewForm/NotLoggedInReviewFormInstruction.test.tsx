import { NotLoggedInReviewFormInstruction } from '@/components/pages/book/Reviews/ReviewForm/NotLoggedInReviewFormInstruction';
import { render, screen } from '@testing-library/react';

describe('NotLoggedInReviewFormInstruction', () => {
    it('should render log in and create an account links with correct hrefs and text', () => {
        render(<NotLoggedInReviewFormInstruction />);

        const loginLink = screen.getByRole('link', { name: /log in/i });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/user/auth/signin');

        const signupLink = screen.getByRole('link', { name: /create an account/i });
        expect(signupLink).toBeInTheDocument();
        expect(signupLink).toHaveAttribute('href', '/user/auth/signup');

        expect(screen.getByText(/please/i)).toBeInTheDocument();
        expect(screen.getByText(/or/i)).toBeInTheDocument();
        expect(screen.getByText(/to leave a review\./i)).toBeInTheDocument();
    });
});
