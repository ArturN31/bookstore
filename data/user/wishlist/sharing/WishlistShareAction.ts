'use server';

import { updateWishlistVisibilityAndToken } from './WishlistShareRepository';

export async function updateWishlistVisibilityAction(
    userId: string,
    isPublic: boolean,
    newToken?: string,
): Promise<{ error: string | null }> {
    try {
        const result = await updateWishlistVisibilityAndToken(
            userId,
            isPublic,
            isPublic ? null : newToken,
        );
        return result;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update visibility';
        return { error: errorMessage };
    }
}
