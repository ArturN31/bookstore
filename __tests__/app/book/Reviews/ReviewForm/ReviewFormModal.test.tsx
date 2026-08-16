import { ReviewFormModal } from '@/app/book/[slug]/components/Reviews/ReviewForm/ReviewFormModal';
import { useUserState } from '@/providers/user/utils/useUser';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(),
}));

jest.mock(
    '@/app/book/[slug]/components/Reviews/ReviewForm/NotLoggedInReviewFormInstruction',
    () => ({
        NotLoggedInReviewFormInstruction: () => (
            <div data-testid="not-logged-in-instruction">Not Logged In</div>
        ),
    }),
);

jest.mock(
    '@/app/book/[slug]/components/Reviews/ReviewForm/ProfileNotCompletedReviewFormInstruction',
    () => ({
        ProfileNotCompletedReviewFormInstruction: () => (
            <div data-testid="profile-not-completed-instruction">Profile Not Completed</div>
        ),
    }),
);

jest.mock('@/app/book/[slug]/components/Reviews/ReviewForm/ReviewForm', () => ({
    ReviewForm: () => <div data-testid="review-form">Review Form Content</div>,
}));

describe('ReviewFormModal', () => {
    const mockUseUserState = useUserState as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render NotLoggedInReviewFormInstruction when user is not logged in', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: false,
            profileExists: false,
        });

        render(<ReviewFormModal bookId="123" />);

        expect(screen.getByTestId('not-logged-in-instruction')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /write a review/i })).not.toBeInTheDocument();
    });

    it('should render ProfileNotCompletedReviewFormInstruction when user is logged in but profile does not exist', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: false,
        });

        render(<ReviewFormModal bookId="123" />);

        expect(screen.getByTestId('profile-not-completed-instruction')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /write a review/i })).not.toBeInTheDocument();
    });

    it('should render Write a Review button and open/close dialog when user is logged in and profile exists', async () => {
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: true,
        });

        render(<ReviewFormModal bookId="123" />);

        const writeButton = screen.getByRole('button', { name: /write a review/i });
        expect(writeButton).toBeInTheDocument();

        expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();

        fireEvent.click(writeButton);
        expect(screen.getByTestId('review-form')).toBeInTheDocument();
        expect(screen.getByText('Create Review')).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByTestId('review-form')).not.toBeInTheDocument();
        });
    });

    it('should support controlled mode and call controlledOnClose when closing', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: true,
        });

        const handleControlledClose = jest.fn();

        render(
            <ReviewFormModal
                bookId="123"
                isOpen={true}
                onClose={handleControlledClose}
            />,
        );

        expect(screen.getByTestId('review-form')).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        expect(handleControlledClose).toHaveBeenCalledTimes(1);
    });

    it('should render Edit Review title when editing mode is enabled via reviewId', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: true,
        });

        render(
            <ReviewFormModal
                bookId="123"
                reviewId="rev-456"
                isOpen={true}
                onClose={jest.fn()}
            />,
        );

        expect(screen.getByText('Edit Review')).toBeInTheDocument();
    });
});
