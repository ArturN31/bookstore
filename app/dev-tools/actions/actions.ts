'use server';

import { createAdminClient } from '@/utils/db/admin';
import { runFullDatabaseSeed } from '@/utils/db/dbSeed/seedDatabase';
import { createBackendClient } from '@/utils/db/server';
import { revalidatePath } from 'next/cache';
import * as handlers from './handlers';

const COMMAND_REGISTRY: Record<string, handlers.CommandHandler> = {
    add_sales: handlers.handleAddSales,
    seed_discounts: handlers.handleSeedDiscounts,
    stock_purge: handlers.handleStockPurge,
    review_bomb: handlers.handleReviewBomb,
    add_carts: handlers.handleAddCarts,
    add_wishlists: handlers.handleAddWishlists,
    add_books: handlers.handleAddBooks,
};

/**
 * CORE COMMAND SYSTEM
 */
export async function systemCommandAction(prevState: any, formData: FormData) {
    if (process.env.NODE_ENV === 'production') {
        return { message: 'Unauthorized: Command rejected in production.', success: false };
    }

    const command = formData.get('command') as string;
    const handler = COMMAND_REGISTRY[command];

    if (!handler) return { message: `Unknown Command: ${command}`, success: false };

    try {
        const supabase = await createAdminClient();
        const result = await handler(supabase);

        revalidatePath('/');
        return result;
    } catch (e: any) {
        console.error(`[DevTools] Command "${command}" failed:`, e);
        return { message: e.message || 'Operation Failed', success: false };
    }
}

/**
 * NUCLEAR OPTION
 */
export async function fullResetAction(prevState: any, formData: FormData) {
    if (process.env.NODE_ENV === 'production') return { message: 'Unauthorized', success: false };
    try {
        await runFullDatabaseSeed();
        revalidatePath('/');
        return { message: 'Full Reset Complete', success: true };
    } catch (e) {
        return { message: 'Reset Failed', success: false };
    }
}

/**
 * AUTH TOOLS
 */
export async function impulseLogin(email: string) {
    const adminClient = await createAdminClient();
    const supabase = await createBackendClient();

    const { data: userList } = await adminClient.auth.admin.listUsers();
    const userId = userList.users.find((u) => u.email === email)?.id || '';

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password: 'DevTempPassword123!',
    });

    if (updateError) throw new Error('ADMIN_UPDATE_FAILED: ' + updateError.message);

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'DevTempPassword123!',
    });

    if (signInError) throw new Error('SIGN_IN_FAILED: ' + signInError.message);

    return { success: true };
}
