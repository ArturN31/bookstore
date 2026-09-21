import { createBackendClient } from '@/utils/db/server';
import { DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { revalidatePath, revalidateTag } from 'next/cache';

export interface UserTableRow {
    username: string | null;
}

export type SupabaseClient = Awaited<ReturnType<typeof createBackendClient>>;
export type AuthUser = NonNullable<
    Awaited<ReturnType<SupabaseClient['auth']['getUser']>>['data']['user']
>;

export function isDuplicateReviewError(dbError: unknown, sanitizedError: string): boolean {
    if (sanitizedError === DB_ERROR_MAP['23505']) return true;

    if (typeof dbError === 'object' && dbError !== null) {
        const errObj = dbError as { code?: unknown; message?: unknown; details?: unknown };
        if (typeof errObj.code === 'string' && errObj.code === '23505') return true;

        const message = typeof errObj.message === 'string' ? errObj.message.toLowerCase() : '';
        const details = typeof errObj.details === 'string' ? errObj.details.toLowerCase() : '';

        if (message.includes('23505') || message.includes('duplicate')) return true;
        if (details.includes('23505') || details.includes('duplicate')) return true;
    }

    if (typeof dbError === 'string') {
        const lowerDbError = dbError.toLowerCase();
        return lowerDbError.includes('23505') || lowerDbError.includes('duplicate');
    }

    return false;
}

export async function resolveUsername(
    supabase: SupabaseClient,
    user: AuthUser,
    providedUsername?: string,
): Promise<string> {
    if (providedUsername && providedUsername.trim() !== '') return providedUsername.trim();

    const result = await safeSupabaseQuery<UserTableRow>(async () =>
        supabase.from('users').select('username').eq('id', user.id).maybeSingle<UserTableRow>(),
    );

    const fetchedUsername = result.data?.username?.trim();

    return (
        fetchedUsername ||
        (typeof user.user_metadata?.username === 'string'
            ? user.user_metadata.username.trim()
            : '') ||
        user.email?.split('@')[0] ||
        'Anonymous'
    );
}

export async function verifyReviewOwnership(
    supabase: SupabaseClient,
    reviewId: string | number,
    userId: string,
): Promise<boolean> {
    const ownershipCheck = await safeSupabaseQuery<{ user_id: string }>(async () =>
        supabase.from('book_reviews').select('user_id').eq('id', reviewId).maybeSingle(),
    );

    const ownershipData = ownershipCheck.data;

    if (!ownershipData || ownershipData.user_id !== userId) {
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
            operation: 'verifyReviewOwnership_failed',
            reviewId,
        });
        return false;
    }
    return true;
}

export function revalidateReviewCaches(bookId: string, slug: string): void {
    revalidateTag('books', 'max');
    revalidateTag('reviews', 'max');
    revalidateTag(`reviews-${bookId}`, 'max');

    revalidatePath(`/book/${slug}`, 'page');
    revalidatePath('/book/[slug]', 'page');
    revalidatePath('/user/reviews/[username]', 'page');
    revalidatePath('/', 'page');
}
