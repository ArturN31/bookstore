import { RelatedBooksNavigationButtons } from '@/app/book/[slug]/components/RelatedBooks/RelatedBooksNavigationButtons';
import { render, screen, fireEvent } from '@testing-library/react';

describe('RelatedBooksNavigationButtons Component', () => {
    const mockHandleScroll = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render left and right navigation buttons', () => {
        render(
            <RelatedBooksNavigationButtons
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
            <RelatedBooksNavigationButtons
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
            <RelatedBooksNavigationButtons
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
            <RelatedBooksNavigationButtons
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
            <RelatedBooksNavigationButtons
                handleScroll={mockHandleScroll}
                canScrollLeft={true}
                canScrollRight={true}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /scroll right/i }));
        expect(mockHandleScroll).toHaveBeenCalledWith('right');
    });
});
