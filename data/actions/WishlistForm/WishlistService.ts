import { addToWishlist, removeFromWishlist } from './WishlistRepository';

const WISHLIST_OPERATIONS: Record<
    string,
    (userId: string, bookId: string) => Promise<ActionResponse<boolean>>
> = {
    INSERT: addToWishlist,
    REMOVE: removeFromWishlist,
};

export const executeWishlistOperation = async (
    type: string,
    userId: string,
    bookId: string,
): Promise<ActionResponse<boolean> & { message?: string }> => {
    const operation = WISHLIST_OPERATIONS[type];

    if (!operation) return { data: null, error: 'Unsupported wishlist action.' };

    const result = await operation(userId, bookId);

    if (result.error) return result;

    return {
        ...result,
        message: type === 'INSERT' ? 'Item added to wishlist.' : 'Item removed from wishlist.',
    };
};
