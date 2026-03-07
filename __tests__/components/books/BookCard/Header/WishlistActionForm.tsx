import React from 'react';
import { WishlistActionForm } from '@/components/books/bookCard/Header/WishlistActionForm';
import { WishlistAction } from '@/data/actions/WishlistForm/WishlistAction';
import { useUserActions, useUserState } from '@/providers/user/utils/useUser';
import { screen, render, fireEvent, waitFor, act } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';

const mockedBook: any = {
    id: 'mock-book-id-123',
    title: 'The Mock Book',
};

jest.mock('notistack', () => ({
    enqueueSnackbar: jest.fn(),
}));

jest.mock('@/data/actions/WishlistForm/WishlistAction', () => ({
    WishlistAction: jest.fn(),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(),
    useUserActions: jest.fn(),
}));

jest.mock('react', () => {
    const ActualReact = jest.requireActual('react');
    return {
        ...ActualReact,
        useActionState: jest.fn((action, initialState) => {
            const [state, setState] = ActualReact.useState(initialState);
            const formAction = async (formData: FormData) => {
                const result = await action(state, formData);
                setState(result);
            };
            return [state, formAction, false];
        }),
    };
});

describe('WishlistActionForm - Full Coverage', () => {
    const mockRefreshWishlist = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        (useUserActions as jest.Mock).mockReturnValue({ refreshWishlist: mockRefreshWishlist });
        (useUserState as jest.Mock).mockReturnValue({
            wishlist: [],
            loggedIn: true,
            loading: false,
        });

        (React.useActionState as jest.Mock).mockImplementation((action, initialState) => {
            return [initialState, jest.fn(), false];
        });
    });

    it('should cover icon branches (Hover + Already Wishlisted)', () => {
        (useUserState as jest.Mock).mockReturnValue({
            wishlist: [{ book_id: mockedBook.id }],
            loggedIn: true,
            loading: false,
        });

        render(<WishlistActionForm book={mockedBook} />);
        const btn = screen.getByRole('button');

        expect(screen.getByTestId('BookmarkAddedOutlinedIcon')).toBeInTheDocument();

        fireEvent.mouseEnter(btn);
        expect(screen.getByTestId('BookmarkRemoveOutlinedIcon')).toBeInTheDocument();
    });

    it('should cover the formAction logic: success and refreshWishlist', async () => {
        (WishlistAction as jest.Mock).mockResolvedValue({
            success: true,
            message: 'Saved!',
        });

        (React.useActionState as jest.Mock).mockImplementation((action, initialState) => {
            const [state, setState] = React.useState(initialState);
            const dispatch = async (formData: FormData) => {
                const result = await action(state, formData);
                if (result) setState(result);
            };
            return [state, dispatch, false];
        });

        render(<WishlistActionForm book={mockedBook} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        expect(WishlistAction).toHaveBeenCalled();
        expect(mockRefreshWishlist).toHaveBeenCalled();
        expect(enqueueSnackbar).toHaveBeenCalledWith(expect.stringContaining('Saved!'), {
            variant: 'success',
        });
    });

    it('should cover the early return when isButtonDisabled is true', async () => {
        (useUserState as jest.Mock).mockReturnValue({
            loggedIn: false,
            wishlist: [],
            loading: false,
        });

        (React.useActionState as jest.Mock).mockImplementation((action, initialState) => {
            const dispatch = (formData: FormData) => action(initialState, formData);
            return [initialState, dispatch, false];
        });

        render(<WishlistActionForm book={mockedBook} />);
        const btn = screen.getByRole('button');

        await act(async () => {
            fireEvent.submit(btn.closest('form')!);
        });

        expect(WishlistAction).not.toHaveBeenCalled();
    });

    it('should render BookmarkAddOutlinedIcon when hovered and NOT wishlisted', () => {
        (useUserState as jest.Mock).mockReturnValue({
            wishlist: [],
            loggedIn: true,
            loading: false,
        });

        render(<WishlistActionForm book={mockedBook} />);
        const btn = screen.getByRole('button');

        fireEvent.mouseEnter(btn);

        expect(screen.getByTestId('BookmarkAddOutlinedIcon')).toBeInTheDocument();

        fireEvent.mouseLeave(btn);
        expect(screen.queryByTestId('BookmarkAddOutlinedIcon')).not.toBeInTheDocument();
        expect(screen.getByTestId('BookmarkBorderIcon')).toBeInTheDocument();
    });

    it('should hit the early return guard in useEffect when state is undefined', () => {
        (React.useActionState as jest.Mock).mockReturnValueOnce([undefined, jest.fn(), false]);

        render(<WishlistActionForm book={mockedBook} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(enqueueSnackbar).not.toHaveBeenCalled();
    });

    it('should cover the error snackbar branch (else if state.message)', () => {
        const errorMessage = 'An unexpected error occurred';

        (React.useActionState as jest.Mock).mockReturnValueOnce([
            { success: false, message: errorMessage },
            jest.fn(),
            false,
        ]);

        render(<WishlistActionForm book={mockedBook} />);

        expect(enqueueSnackbar).toHaveBeenCalledWith(errorMessage, { variant: 'error' });
    });

    it('shows "Wishlist limit reached" when at limit AND adding (Truth branch)', () => {
        (useUserState as jest.Mock).mockReturnValue({
            wishlist: Array(10).fill({ book_id: 'other-id' }),
            loggedIn: true,
            loading: false,
        });

        render(<WishlistActionForm book={mockedBook} />);
        const button = screen.getByRole('button');

        expect(button).toHaveAttribute('title', 'Wishlist limit reached');
        expect(button).toBeDisabled();
    });
});
