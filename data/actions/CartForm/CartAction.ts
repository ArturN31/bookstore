'use server';

import { z } from 'zod';
import { createBackendClient } from '@/utils/db/server';
import { getUserData } from '@/data/user/GetUserData';
import {
    addItemToUsersCart,
    createUsersCart,
    getUsersCartID,
    removeItemFromUsersCart,
    updateItemInUsersCart,
} from '@/data/cart/GetCartData';
import { cartSchema } from '@/data/schemas/cartSchema';
import { revalidatePath } from 'next/cache';

export type CartFormState = {
    success: boolean;
    message: string;
    validationErrors?: z.core.$ZodIssue[];
    timestamp?: number;
};

export async function CartAction(
    prevState: CartFormState | undefined,
    formData: FormData,
): Promise<CartFormState> {
    const rawData = {
        bookId: formData.get('book-id'),
        bookQuantity: formData.get('book-quantity') || '1',
        actionType: formData.get('action-type'),
    };

    const validated = cartSchema.safeParse(rawData);

    if (!validated.success)
        return {
            success: false,
            message: 'Invalid cart data.',
            validationErrors: validated.error.issues,
        };

    const { bookId, bookQuantity, actionType } = validated.data;
    const supabase = await createBackendClient();
    const user = await getUserData(supabase);

    if (!user) return { success: false, message: 'You must be logged in to manage your cart.' };

    try {
        let cartID = await getUsersCartID(supabase, user.id);

        if (!cartID) {
            const createCartResult = await createUsersCart(supabase, user.id);
            if (!createCartResult) throw new Error('Failed to create cart');
            cartID = await getUsersCartID(supabase, user.id);
        }

        if (!cartID) return { success: false, message: 'Could not resolve cart.' };

        switch (actionType) {
            case 'INSERT':
                const insertOk = await addItemToUsersCart(supabase, cartID, bookId, bookQuantity);
                if (!insertOk) return { success: false, message: 'Error adding to cart.' };
                break;

            case 'UPDATE':
                const updateOk = await updateItemInUsersCart(
                    supabase,
                    cartID,
                    bookId,
                    bookQuantity,
                );
                if (!updateOk) return { success: false, message: 'Failed to update quantity.' };
                break;

            case 'REMOVE':
                const removeOk = await removeItemFromUsersCart(supabase, cartID, bookId);
                if (!removeOk) return { success: false, message: 'Failed to remove item.' };
                break;
        }

        revalidatePath('/', 'layout');

        return {
            success: true,
            message: `Cart ${actionType.toLowerCase()} successful.`,
            timestamp: Date.now(),
        };
    } catch (err) {
        console.error('Cart Action Error:', err);
        return { success: false, message: 'An unexpected error occurred.' };
    }
}
