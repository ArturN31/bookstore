'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/GetUserData';
import { wishlistSchema } from '@/data/schemas/wishlistSchema';
import { executeWishlistOperation } from './WishlistService';

export type WishlistFormState = {
    success: boolean;
    message: string;
    validationErrors?: z.core.$ZodIssue[];
    timestamp?: number;
};

export async function WishlistAction(
    prevState: WishlistFormState | undefined,
    formData: FormData,
): Promise<WishlistFormState> {
    const rawData = {
        bookId: formData.get('book-id'),
        actionType: formData.get('action-type'),
    };

    const validated = wishlistSchema.safeParse(rawData);
    if (!validated.success)
        return {
            success: false,
            message: 'Invalid wishlist request.',
            validationErrors: validated.error.issues,
        };

    const { bookId, actionType } = validated.data;

    try {
        const supabase = await createBackendClient();

        const { data: user, error: authError } = await getUserData();
        if (authError || !user)
            return {
                success: false,
                message: 'Login required to manage wishlist.',
            };

        const result = await executeWishlistOperation(supabase, actionType, user.id, bookId);

        if (result.error) return { success: false, message: result.error };

        revalidatePath('/', 'layout');

        const actionVerb = actionType === 'INSERT' ? 'added to' : 'removed from';
        return {
            success: true,
            message: `Item successfully ${actionVerb} wishlist.`,
            timestamp: Date.now(),
        };
    } catch (err) {
        console.error('[WishlistAction] Pipeline Failure:', err);
        return {
            success: false,
            message: 'A system error occurred. Please try again.',
        };
    }
}
