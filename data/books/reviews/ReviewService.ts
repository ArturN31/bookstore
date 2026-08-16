'use server';

import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { revalidatePath, revalidateTag } from 'next/cache';

const PAGE_SIZE = 5;

export interface FetchUserReviewsResponse {
    reviews: Review[];
    booksMap: Record<string | number, Partial<BookDB> | null>;
    hasMore: boolean;
    error: string | null;
}

export async function fetchUserReviewsAction(page: number): Promise<FetchUserReviewsResponse> {
    const supabase = await createBackendClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
            operation: 'fetchUserReviewsAction_auth_failed',
            error: authError ? sanitizeSupabaseError(authError) : 'Session expired',
        });
        return {
            reviews: [],
            booksMap: {},
            hasMore: false,
            error: 'Session expired',
        };
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;

    const reviewsQueryResult = await safeSupabaseQuery(async () =>
        supabase
            .from('book_reviews')
            .select(
                `
                id,
                book_id,
                user_id,
                username,
                rating,
                review,
                created_at,
                updated_at,
                books (
                    id,
                    title,
                    author
                )
            `,
            )
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to),
    );

    if (reviewsQueryResult.error || !reviewsQueryResult.data) {
        console.error(
            '[fetchUserReviewsAction] Failed to fetch users reviews:',
            reviewsQueryResult.error,
        );
        return {
            reviews: [],
            booksMap: {},
            hasMore: false,
            error: reviewsQueryResult.error ?? 'Failed to fetch reviews',
        };
    }

    const rawReviews = reviewsQueryResult.data;
    const hasMore = rawReviews.length > PAGE_SIZE;
    const slicedRaw = hasMore ? rawReviews.slice(0, PAGE_SIZE) : rawReviews;

    const reviews: Review[] = slicedRaw.map(({ books: _books, ...review }) => review);
    const booksMap: Record<string | number, Partial<BookDB> | null> = {};

    slicedRaw.forEach((item) => {
        const book = Array.isArray(item.books) ? item.books[0] : item.books;
        booksMap[item.id] = book ?? null;
    });

    return {
        reviews,
        booksMap,
        hasMore,
        error: null,
    };
}

export async function deleteReviewAction(
    reviewId: string | number,
): Promise<{ success: boolean; message?: string }> {
    const supabase = await createBackendClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
            operation: 'deleteReviewAction_auth_failed',
            error: authError ? sanitizeSupabaseError(authError) : 'Session expired',
        });
        return { success: false, message: 'Session expired' };
    }

    const reviewResult = await safeSupabaseQuery<{ book_id: string }[]>(async () =>
        supabase.from('book_reviews').select('book_id').eq('id', reviewId).eq('user_id', user.id),
    );

    const bookId = reviewResult.data?.[0]?.book_id;

    const deleteResult = await safeSupabaseQuery<{ id: string | number }[]>(async () =>
        supabase
            .from('book_reviews')
            .delete()
            .eq('id', reviewId)
            .eq('user_id', user.id)
            .select('id'),
    );

    if (deleteResult.error || !deleteResult.data || deleteResult.data.length === 0) {
        console.error('[deleteReviewAction] Failed to delete review:', deleteResult.error);
        return {
            success: false,
            message: deleteResult.error
                ? sanitizeSupabaseError(deleteResult.error)
                : 'Failed to delete review.',
        };
    }

    revalidateTag('reviews', 'max');
    revalidateTag('books', 'max');
    if (bookId) revalidateTag(`reviews-${bookId}`, 'max');

    revalidatePath('/user/content/reviews', 'page');
    revalidatePath('/book/[slug]', 'page');
    if (bookId) revalidatePath(`/book/${bookId}`, 'page');
    revalidatePath('/', 'page');

    return { success: true };
}
