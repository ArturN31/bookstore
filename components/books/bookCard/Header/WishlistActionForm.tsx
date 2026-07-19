'use client';

import { useActionState, useEffect, useMemo, useOptimistic, startTransition } from 'react';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LockIcon from '@mui/icons-material/Lock';
import { useUserState, useUserActions } from '@/providers/user/utils/useUser';
import { enqueueSnackbar } from 'notistack';
import { WishlistAction, WishlistFormState } from '@/data/actions/WishlistForm/WishlistAction';
import { AppTooltip } from '@/components/ui/AppTooltip';

const WISHLIST_LIMIT = 10;

interface WishlistActionFormProps {
    book: Book;
}

export const WishlistActionForm = ({ book }: WishlistActionFormProps) => {
    const { wishlist, loggedIn, loading: userLoading } = useUserState();
    const { refreshWishlist } = useUserActions();
    const { id } = book;

    const isActuallyWishlisted = useMemo(
        () => wishlist.some((item) => item.book_id === id),
        [wishlist, id],
    );

    const [optimisticWishlisted, setOptimisticWishlisted] = useOptimistic(
        isActuallyWishlisted,
        (_, newState: boolean) => newState,
    );

    const atLimit = wishlist.length >= WISHLIST_LIMIT;
    const isAddMode = !optimisticWishlisted;
    const isButtonDisabled = !userLoading && (!loggedIn || (isAddMode && atLimit));

    const [state, formAction] = useActionState(
        async (prevState: WishlistFormState, formData: FormData) => {
            if (isButtonDisabled) return prevState;

            const result = await WishlistAction(prevState, formData);
            if (result?.success) await refreshWishlist();
            return result;
        },
        { success: false, message: '' } as WishlistFormState,
    );

    useEffect(() => {
        if (!state?.message) return;

        const variant = state.success ? 'success' : 'error';
        enqueueSnackbar(state.message, { variant });
    }, [
        state.message,
        state.success,
        state.timestamp,
        isActuallyWishlisted,
        setOptimisticWishlisted,
    ]);

    const handleAction = (formData: FormData) => {
        startTransition(() => {
            setOptimisticWishlisted(!isActuallyWishlisted);
            formAction(formData);
        });
    };

    const tooltipLabel = useMemo(() => {
        if (!loggedIn) return 'Log in to save';
        if (atLimit && isAddMode) return 'Wishlist full';
        return optimisticWishlisted ? 'Remove item' : 'Save item';
    }, [loggedIn, atLimit, isAddMode, optimisticWishlisted]);

    const getButtonStyles = () => {
        const base =
            'group cursor-pointer relative flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-all duration-300 active:scale-95';

        if (!loggedIn)
            return `${base} bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-not-allowed`;

        if (atLimit && isAddMode)
            return `${base} bg-slate-50 text-slate-300 cursor-not-allowed grayscale`;

        if (optimisticWishlisted)
            return `${base} bg-slate-100 text-[#1e293b] hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent`;

        return `${base} bg-slate-50 text-slate-400 hover:bg-[#facc15] hover:text-[#1e293b] hover:shadow-md`;
    };

    return (
        <AppTooltip title={tooltipLabel}>
            <form
                action={handleAction}
                className="flex"
            >
                <input
                    type="hidden"
                    name="book-id"
                    value={id}
                />
                <input
                    type="hidden"
                    name="action-type"
                    value={isActuallyWishlisted ? 'REMOVE' : 'INSERT'}
                />

                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isButtonDisabled)
                            startTransition(() => setOptimisticWishlisted(!optimisticWishlisted));
                    }}
                    className={getButtonStyles()}
                >
                    <div className="relative flex items-center justify-center">
                        {!loggedIn ? (
                            <LockIcon className="text-[0.9rem] transition-transform group-hover:rotate-12" />
                        ) : isAddMode ? (
                            <>
                                <BookmarkIcon className="animate-in zoom-in text-[1.1rem] duration-300" />
                                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#facc15] ring-2 ring-slate-100 group-hover:bg-red-500" />
                            </>
                        ) : (
                            <BookmarkBorderIcon className="text-[1.1rem] transition-transform group-hover:scale-110" />
                        )}
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase">
                        {isAddMode ? 'Saved' : 'Save'}
                    </span>
                </button>
            </form>
        </AppTooltip>
    );
};
