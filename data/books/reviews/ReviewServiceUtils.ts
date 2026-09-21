import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { revalidatePath, revalidateTag } from 'next/cache';

export type SupabaseClient = Awaited<ReturnType<typeof createBackendClient>>;

export async function verifyReviewForDeletion(
    supabase: SupabaseClient,
    reviewId: string | number,
    userId: string,
): Promise<{ isValid: boolean; bookId?: string }> {
    const reviewResult = await safeSupabaseQuery<{ user_id: string; book_id: string }>(async () =>
        supabase.from('book_reviews').select('user_id, book_id').eq('id', reviewId).maybeSingle(),
    );

    const reviewData = reviewResult.data;

    if (!reviewData || reviewData.user_id !== userId) {
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', userId, {
            operation: 'verifyReviewForDeletion_unauthorized',
            reviewId,
        });
        return { isValid: false };
    }

    return { isValid: true, bookId: reviewData.book_id };
}

export function revalidateServiceCaches(bookId?: string): void {
    revalidateTag('reviews', 'max');
    revalidateTag('books', 'max');
    if (bookId) revalidateTag(`reviews-${bookId}`, 'max');

    revalidatePath('/user/reviews/[username]', 'page');
    revalidatePath('/book/[slug]', 'page');
    revalidatePath('/books', 'page');
    if (bookId) revalidatePath(`/book/${bookId}`, 'page');
    revalidatePath('/', 'page');
}
