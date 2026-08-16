import { DeleteReviewModal } from '@/app/user/content/reviews/components/DeleteReviewModal';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

describe('DeleteReviewModal', () => {
    const mockOnClose = jest.fn<void, []>();
    const mockOnConfirm = jest.fn<Promise<void>, []>();

    beforeEach(() => {
        jest.clearAllMocks();
        mockOnConfirm.mockResolvedValue(undefined);
    });

    it('should render correctly when open', () => {
        render(
            <DeleteReviewModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Delete Review' })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type DELETE')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete review/i })).toBeDisabled();
    });

    it('should not be visible when isOpen is false', () => {
        render(
            <DeleteReviewModal
                isOpen={false}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        expect(screen.queryByText('Delete Review')).not.toBeInTheDocument();
    });

    it('should keep confirm button disabled if text does not match DELETE', () => {
        render(
            <DeleteReviewModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        const input = screen.getByPlaceholderText('Type DELETE');
        fireEvent.change(input, { target: { value: 'DEL' } });

        const confirmButton = screen.getByRole('button', { name: /delete review/i });
        expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when DELETE is typed', () => {
        render(
            <DeleteReviewModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        const input = screen.getByPlaceholderText('Type DELETE');
        fireEvent.change(input, { target: { value: 'DELETE' } });

        const confirmButton = screen.getByRole('button', { name: /delete review/i });
        expect(confirmButton).toBeEnabled();
    });

    it('should call onClose when Cancel button is clicked', () => {
        render(
            <DeleteReviewModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close icon button is clicked', () => {
        render(
            <DeleteReviewModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion flow successfully when confirmed', async () => {
        render(
            <DeleteReviewModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        const input = screen.getByPlaceholderText('Type DELETE');
        fireEvent.change(input, { target: { value: 'DELETE' } });

        const confirmButton = screen.getByRole('button', { name: /delete review/i });
        fireEvent.click(confirmButton);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    it('should disable inputs and buttons while deleting', async () => {
        let resolveConfirm: () => void = () => {};
        const delayedConfirm = new Promise<void>((resolve) => {
            resolveConfirm = resolve;
        });
        mockOnConfirm.mockReturnValue(delayedConfirm);

        render(
            <DeleteReviewModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        const input = screen.getByPlaceholderText('Type DELETE');
        fireEvent.change(input, { target: { value: 'DELETE' } });

        const confirmButton = screen.getByRole('button', { name: /delete review/i });
        fireEvent.click(confirmButton);

        expect(screen.getByText('Deleting...')).toBeInTheDocument();
        expect(input).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

        resolveConfirm();

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    it('should prevent closing via backdrop click while deleting is in progress', async () => {
        let resolveConfirm: () => void = () => {};
        const delayedConfirm = new Promise<void>((resolve) => {
            resolveConfirm = resolve;
        });
        mockOnConfirm.mockReturnValue(delayedConfirm);

        render(
            <DeleteReviewModal
                isOpen={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
            />,
        );

        const input = screen.getByPlaceholderText('Type DELETE');
        fireEvent.change(input, { target: { value: 'DELETE' } });

        const confirmButton = screen.getByRole('button', { name: /delete review/i });
        fireEvent.click(confirmButton);

        // Attempt to close via backdrop click while isDeleting is true
        const backdrop = document.querySelector('.MuiBackdrop-root');
        if (backdrop) {
            fireEvent.click(backdrop);
        }

        expect(mockOnClose).not.toHaveBeenCalled();

        resolveConfirm();

        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });
});
