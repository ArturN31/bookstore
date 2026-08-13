import { ReviewFormActionBtns } from '@/app/book/[slug]/components/Reviews/ReviewForm/FormItems/ReviewFormActionBtns';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ReviewFormActionBtns', () => {
    it('should render default buttons and handle clicks correctly', () => {
        const handleClose = jest.fn();
        const handleReset = jest.fn();

        render(
            <ReviewFormActionBtns
                handleClose={handleClose}
                handleReset={handleReset}
                isSubmitting={false}
                isResetting={false}
            />,
        );

        const resetButton = screen.getByRole('button', { name: /reset/i });
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        const submitButton = screen.getByRole('button', { name: /submit review/i });

        expect(resetButton).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();
        expect(submitButton).toBeInTheDocument();

        fireEvent.click(resetButton);
        expect(handleReset).toHaveBeenCalledTimes(1);

        fireEvent.click(cancelButton);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should show loading spinner and text when resetting', () => {
        render(
            <ReviewFormActionBtns
                handleClose={jest.fn()}
                handleReset={jest.fn()}
                isSubmitting={false}
                isResetting={true}
            />,
        );

        expect(screen.getByText('Resetting...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /resetting.../i })).toBeDisabled();
    });

    it('should show loading spinner and text when submitting', () => {
        render(
            <ReviewFormActionBtns
                handleClose={jest.fn()}
                handleReset={jest.fn()}
                isSubmitting={true}
                isResetting={false}
            />,
        );

        expect(screen.getByText('Submitting...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submitting.../i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
});
