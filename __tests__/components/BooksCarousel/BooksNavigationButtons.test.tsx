import { BooksNavigationButtons } from '@/components/books/BooksCarousel/BooksNavigationButtons';
import { render, screen, fireEvent } from '@testing-library/react';

describe('BooksNavigationButtons Component', () => {
    const mockHandleScroll = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render left and right navigation buttons', () => {
        render(
            <BooksNavigationButtons
                handleScroll={mockHandleScroll}
                canScrollLeft={true}
                canScrollRight={true}
            />,
        );

        expect(screen.getByRole('button', { name: /scroll left/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /scroll right/i })).toBeInTheDocument();
    });

    it('should disable scroll left button when canScrollLeft is false', () => {
        render(
            <BooksNavigationButtons
                handleScroll={mockHandleScroll}
                canScrollLeft={false}
                canScrollRight={true}
            />,
        );

        expect(screen.getByRole('button', { name: /scroll left/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /scroll right/i })).toBeEnabled();
    });

    it('should disable scroll right button when canScrollRight is false', () => {
        render(
            <BooksNavigationButtons
                handleScroll={mockHandleScroll}
                canScrollLeft={true}
                canScrollRight={false}
            />,
        );

        expect(screen.getByRole('button', { name: /scroll left/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /scroll right/i })).toBeDisabled();
    });

    it('should call handleScroll with "left" when the left button is clicked', () => {
        render(
            <BooksNavigationButtons
                handleScroll={mockHandleScroll}
                canScrollLeft={true}
                canScrollRight={true}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /scroll left/i }));
        expect(mockHandleScroll).toHaveBeenCalledWith('left');
    });

    it('should call handleScroll with "right" when the right button is clicked', () => {
        render(
            <BooksNavigationButtons
                handleScroll={mockHandleScroll}
                canScrollLeft={true}
                canScrollRight={true}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /scroll right/i }));
        expect(mockHandleScroll).toHaveBeenCalledWith('right');
    });
});
