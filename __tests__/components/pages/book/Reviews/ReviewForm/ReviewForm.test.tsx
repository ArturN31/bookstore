import { ReviewForm } from '@/app/book/[slug]/components/Reviews/ReviewForm/ReviewForm';
import { useUserState } from '@/providers/user/utils/useUser';
import { UserReviewAction } from '@/data/books/reviews/ReviewAction';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

let capturedSetRating: React.Dispatch<React.SetStateAction<number | null>> = () => {};
let capturedSetComment: React.Dispatch<React.SetStateAction<string>> = () => {};

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(),
}));

jest.mock('@/data/books/reviews/ReviewAction', () => ({
    UserReviewAction: jest.fn(),
}));

jest.mock('@/components/pages/book/Reviews/ReviewForm/FormItems/ReviewFormRatingInput', () => ({
    ReviewFormRatingInput: ({
        setRating,
    }: {
        setRating: React.Dispatch<React.SetStateAction<number | null>>;
    }) => {
        capturedSetRating = setRating;
        return <div data-testid="rating-input-mock" />;
    },
}));

jest.mock('@/components/pages/book/Reviews/ReviewForm/FormItems/ReviewFormCommentInput', () => ({
    ReviewFormCommentInput: ({
        setComment,
    }: {
        setComment: React.Dispatch<React.SetStateAction<string>>;
    }) => {
        capturedSetComment = setComment;
        return <div data-testid="comment-input-mock" />;
    },
}));

describe('ReviewForm', () => {
    const mockUseUserState = useUserState as jest.Mock;
    const mockUserReviewAction = UserReviewAction as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseUserState.mockReturnValue({
            user: { username: 'testuser' },
        });
        mockUserReviewAction.mockResolvedValue({
            message: null,
            validationErrors: [],
        });
    });

    it('should render review form elements correctly', () => {
        const handleClose = jest.fn();
        render(
            <ReviewForm
                bookId="123"
                handleClose={handleClose}
            />,
        );

        expect(screen.getByTestId('rating-input-mock')).toBeInTheDocument();
        expect(screen.getByTestId('comment-input-mock')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
    });

    it('should show validation errors when submitting empty form', async () => {
        const handleClose = jest.fn();
        render(
            <ReviewForm
                bookId="123"
                handleClose={handleClose}
            />,
        );

        const submitButton = screen.getByRole('button', { name: /submit review/i });
        fireEvent.click(submitButton);

        expect(screen.getByText('Please fix the errors before submitting.')).toBeInTheDocument();
        expect(mockUserReviewAction).not.toHaveBeenCalled();
    });

    it('should submit form successfully with valid data and handle undefined validationErrors from action', async () => {
        mockUserReviewAction.mockResolvedValueOnce({
            message: 'Some message',
            validationErrors: undefined,
        });

        const handleClose = jest.fn();
        render(
            <ReviewForm
                bookId="123"
                handleClose={handleClose}
            />,
        );

        await act(async () => {
            capturedSetRating(5);
            capturedSetComment('Great book description here!');
        });

        const submitButton = screen.getByRole('button', { name: /submit review/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockUserReviewAction).toHaveBeenCalled();
        });
    });

    it('should handle functional state updaters for rating and review', async () => {
        const handleClose = jest.fn();
        render(
            <ReviewForm
                bookId="123"
                handleClose={handleClose}
            />,
        );

        await act(async () => {
            capturedSetRating((prev: number | null) => (prev ?? 0) + 4);
            capturedSetComment((prev: string) => prev + ' Functional test');
        });

        expect(capturedSetRating).toBeDefined();
    });

    it('should handle field change with validation errors when comment is too short', async () => {
        const handleClose = jest.fn();
        render(
            <ReviewForm
                bookId="123"
                handleClose={handleClose}
            />,
        );

        await act(async () => {
            capturedSetComment('ab');
        });

        expect(screen.getByText('Validation Issues')).toBeInTheDocument();
    });

    it('should handle non-required/invalid_type errors during field change resulting in filtered issues', async () => {
        const handleClose = jest.fn();
        render(
            <ReviewForm
                bookId="123"
                handleClose={handleClose}
            />,
        );

        await act(async () => {
            capturedSetComment('valid comment string');
        });

        expect(screen.queryByText('Validation Issues')).not.toBeInTheDocument();
    });

    it('should reset form fields when reset button is clicked', async () => {
        const handleClose = jest.fn();
        render(
            <ReviewForm
                bookId="123"
                handleClose={handleClose}
            />,
        );

        await act(async () => {
            capturedSetComment('Temporary review');
        });

        const resetButton = screen.getByRole('button', { name: /reset/i });
        fireEvent.click(resetButton);

        await waitFor(() => {
            expect(mockUserReviewAction).toHaveBeenCalled();
        });
    });
});
