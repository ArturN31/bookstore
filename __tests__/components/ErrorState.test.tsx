import { ErrorState } from '@/components/ui/ErrorState';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ErrorState', () => {
    it('should render with default title and message', () => {
        render(<ErrorState />);

        expect(screen.getByText('Connection Interrupted')).toBeInTheDocument();
        expect(screen.getByText(/We're having trouble reaching our archives/i)).toBeInTheDocument();
    });

    it('should render custom title and message', () => {
        const customTitle = 'Oops!';
        const customMessage = 'Something went wrong.';
        render(
            <ErrorState
                title={customTitle}
                message={customMessage}
            />,
        );

        expect(screen.getByText(customTitle)).toBeInTheDocument();
        expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should apply full-page styles when fullPage is true (default)', () => {
        const { container } = render(<ErrorState fullPage={true} />);
        expect(container.firstChild).toHaveClass('min-h-[60vh]');
    });

    it('should apply inline styles when fullPage is false', () => {
        const { container } = render(<ErrorState fullPage={false} />);
        expect(container.firstChild).toHaveClass('py-12');
        expect(container.firstChild).not.toHaveClass('min-h-[60vh]');
    });

    it('should render retry button and call onRetry when clicked', () => {
        const mockRetry = jest.fn();
        render(<ErrorState onRetry={mockRetry} />);

        const retryBtn = screen.getByRole('button', { name: /refresh page/i });
        expect(retryBtn).toBeInTheDocument();

        fireEvent.click(retryBtn);
        expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button if onRetry is not provided', () => {
        render(<ErrorState />);

        const retryBtn = screen.queryByRole('button', { name: /refresh page/i });
        expect(retryBtn).not.toBeInTheDocument();
    });
});
