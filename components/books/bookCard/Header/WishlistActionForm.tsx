'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import BookmarkAddedOutlinedIcon from '@mui/icons-material/BookmarkAddedOutlined';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import { useUserState, useUserActions } from '@/providers/user/utils/useUser';
import { enqueueSnackbar } from 'notistack';
import { WishlistAction, WishlistFormState } from '@/data/actions/WishlistForm/WishlistAction';

const WISHLIST_LIMIT = 10;

export const WishlistActionForm = ({ book }: { book: Book }) => {
    const [hover, setHover] = useState(false);
    const { wishlist, loggedIn, loading: userLoading } = useUserState();
    const { refreshWishlist } = useUserActions();
    const { id, title } = book;

    const isWishlisted = useMemo(
        () => wishlist.some((item) => item.book_id === id),
        [wishlist, id],
    );

    const atLimit = wishlist.length >= WISHLIST_LIMIT;
    const isAddMode = !isWishlisted;
    const isButtonDisabled = !userLoading && (!loggedIn || (isAddMode && atLimit));

    const [state, formAction] = useActionState(
        async (prevState: WishlistFormState | undefined, formData: FormData) => {
            if (isButtonDisabled) return prevState;

            const result = await WishlistAction(prevState, formData);

            if (result?.success) await refreshWishlist();
            return result;
        },
        { success: false, message: '' } as WishlistFormState,
    );

    useEffect(() => {
        if (!state) return;

        if (state.success) enqueueSnackbar(`${title}: ${state.message}`, { variant: 'success' });
        else if (state.message) enqueueSnackbar(state.message, { variant: 'error' });
    }, [state, title]);

    return (
        <div className="w-fit">
            <form action={formAction}>
                <input
                    type="hidden"
                    name="book-id"
                    value={id}
                />
                <input
                    type="hidden"
                    name="action-type"
                    value={isWishlisted ? 'REMOVE' : 'INSERT'}
                />

                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    onClick={(e) => e.stopPropagation()}
                    title={atLimit && isAddMode ? 'Wishlist limit reached' : ''}
                    className={`cursor-pointer transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    {isWishlisted ? (
                        hover ? (
                            <BookmarkRemoveOutlinedIcon sx={{ color: '#FF0000' }} />
                        ) : (
                            <BookmarkAddedOutlinedIcon sx={{ color: '#007700' }} />
                        )
                    ) : hover && !isButtonDisabled ? (
                        <BookmarkAddOutlinedIcon sx={{ color: '#007700' }} />
                    ) : (
                        <BookmarkBorderIcon />
                    )}
                </button>
            </form>

            {!loggedIn && !userLoading && (
                <p className="absolute mt-1 text-[10px] text-gray-400">Sign in to save</p>
            )}
        </div>
    );
};
