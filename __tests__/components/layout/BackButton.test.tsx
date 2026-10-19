import { render, screen, fireEvent } from '@testing-library/react';
import { BackButton } from '@/components/layout/BackButton';

const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        back: mockBack,
    }),
}));

describe('BackButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the back button correctly', () => {
        render(<BackButton />);
        const button = screen.getByRole('button', { name: /back/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('← Back');
    });

    it('calls router.back when clicked', () => {
        render(<BackButton />);
        const button = screen.getByRole('button', { name: /back/i });
        fireEvent.click(button);
        expect(mockBack).toHaveBeenCalledTimes(1);
    });
});
