'use server';

import { z } from 'zod';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/GetUserData';
import { wishlistSchema } from '@/data/schemas/wishlistSchema';
import { revalidatePath } from 'next/cache';

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
    const supabase = await createBackendClient();
    const user = await getUserData();

    if (!user)
        return {
            success: false,
            message: 'You must be logged in to manage your wishlist.',
        };

    try {
        switch (actionType) {
            case 'INSERT':
                const { error: insertError } = await supabase
                    .from('wishlist')
                    .insert([{ user_id: user.id, book_id: bookId }]);

                if (insertError) {
                    console.error('Wishlist Insert Error:', insertError.message);
                    return { success: false, message: 'Could not add to wishlist.' };
                }
                break;

            case 'REMOVE':
                const { error: removeError } = await supabase
                    .from('wishlist')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('book_id', bookId);

                if (removeError) {
                    console.error('Wishlist Remove Error:', removeError.message);
                    return { success: false, message: 'Could not remove from wishlist.' };
                }
                break;
        }

        revalidatePath('/', 'layout');

        return {
            success: true,
            message: `Item successfully ${actionType === 'INSERT' ? 'added to' : 'removed from'} wishlist.`,
            timestamp: Date.now(),
        };
    } catch (err) {
        console.error('Wishlist Action Unexpected Error:', err);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
