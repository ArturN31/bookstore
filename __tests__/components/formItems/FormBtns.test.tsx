import { FormBtns } from '@/components/formItems/FormBtns';
import { render, screen, fireEvent } from '@testing-library/react';

describe('APP - FormItems - FormBtns', () => {
    const mockHandleReset = jest.fn();

    const defaultProps = {
        isTransitioningSubmit: false,
        isTransitioningReset: false,
        handleReset: mockHandleReset,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show "Submit" and be enabled by default', () => {
        render(<FormBtns {...defaultProps} />);
        const submitBtn = screen.getByRole('button', { name: /submit/i });

        expect(submitBtn).toBeInTheDocument();
        expect(submitBtn).toBeEnabled();
    });

    it('should show "Submitting..." and be disabled when isTransitioningSubmit is true', () => {
        render(
            <FormBtns
                {...defaultProps}
                isTransitioningSubmit={true}
            />,
        );
        const submitBtn = screen.getByRole('button', { name: /submitting.../i });

        expect(submitBtn).toBeDisabled();
    });

    it('should show "Clear" and be enabled by default', () => {
        render(<FormBtns {...defaultProps} />);
        const resetBtn = screen.getByTestId('reset-btn');

        expect(resetBtn).toHaveTextContent('Clear');
        expect(resetBtn).toBeEnabled();
    });

    it('should show "Clearing..." and be disabled when isTransitioningReset is true', () => {
        render(
            <FormBtns
                {...defaultProps}
                isTransitioningReset={true}
            />,
        );
        const resetBtn = screen.getByTestId('reset-btn');

        expect(resetBtn).toHaveTextContent('Clearing...');
        expect(resetBtn).toBeDisabled();
    });
});
