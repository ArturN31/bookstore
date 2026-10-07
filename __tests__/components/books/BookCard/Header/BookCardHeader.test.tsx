import { BookCardHeader } from '@/components/books/bookCard/BookCardHeader';
import { useUserState } from '@/providers/user/utils/useUser';
import { createMockBook } from '@/utils/testing/mockBook';
import { render, screen } from '@testing-library/react';

const mockedBook = createMockBook();

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

jest.mock('@/data/user/wishlist/WishlistAction', () => ({
    WishlistAction: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(() => ({
        username: 'testuser',
    })),
}));

jest.mock('@/components/books/bookCard/Header/WishlistActionForm', () => ({
    WishlistActionForm: () => <div data-testid="mock-wishlist" />,
}));
jest.mock('@/components/books/bookCard/Header/BookRating', () => ({
    BookRating: () => <div data-testid="mock-rating" />,
}));

describe('APP - BookCard - Header', () => {
    const mockUseUserState = jest.mocked(useUserState);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render wishlist and rating when logged in and profile exists', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: true,
        } as unknown as ReturnType<typeof useUserState>);

        render(<BookCardHeader book={mockedBook} />);

        expect(screen.getByTestId('mock-wishlist')).toBeInTheDocument();
        expect(screen.getByTestId('mock-rating')).toBeInTheDocument();
    });

    it('should fallback to empty reviews array when book.reviews is undefined', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: true,
        } as unknown as ReturnType<typeof useUserState>);

        const bookWithoutReviews: Book = {
            ...mockedBook,
            reviews: undefined as unknown as Book['reviews'],
        };

        render(<BookCardHeader book={bookWithoutReviews} />);

        expect(screen.getByTestId('mock-rating')).toBeInTheDocument();
    });

    it('should not render wishlist when not logged in', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: false,
            profileExists: false,
        } as unknown as ReturnType<typeof useUserState>);

        render(<BookCardHeader book={mockedBook} />);

        expect(screen.queryByTestId('mock-wishlist')).not.toBeInTheDocument();
        expect(screen.getByTestId('mock-rating')).toBeInTheDocument();
    });

    it('should hide wishlist if profileExists is false even if loggedIn', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: false,
        } as unknown as ReturnType<typeof useUserState>);

        render(<BookCardHeader book={mockedBook} />);

        expect(screen.queryByTestId('mock-wishlist')).not.toBeInTheDocument();
    });

    it('should hide wishlist if loggedIn is false even if profileExists', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: false,
            profileExists: true,
        } as unknown as ReturnType<typeof useUserState>);

        render(<BookCardHeader book={mockedBook} />);

        expect(screen.queryByTestId('mock-wishlist')).not.toBeInTheDocument();
    });

    it('should call stopPropagation on wishlist wrapper click (covers line 15 onClick)', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: true,
        } as unknown as ReturnType<typeof useUserState>);

        render(<BookCardHeader book={mockedBook} />);

        const wishlistWrapper = screen.getByTestId('mock-wishlist').parentElement;
        expect(wishlistWrapper).toBeInTheDocument();

        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });

        let stopPropagationCalled = false;
        const originalStopPropagation = clickEvent.stopPropagation.bind(clickEvent);
        clickEvent.stopPropagation = () => {
            stopPropagationCalled = true;
            originalStopPropagation();
        };

        if (wishlistWrapper) {
            wishlistWrapper.dispatchEvent(clickEvent);
            expect(stopPropagationCalled).toBe(true);
        }
    });
});
