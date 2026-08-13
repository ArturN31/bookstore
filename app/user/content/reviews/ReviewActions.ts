// app/user/content/reviews/ReviewActions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { ReviewDB } from './page';

const PAGE_SIZE = 5;

export interface FetchReviewsResponse {
    reviews: ReviewDB[];
    hasMore: boolean;
    error: string | null;
}

export async function fetchUserReviewsAction(page: number): Promise<FetchReviewsResponse> {
    const supabase = await createBackendClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { reviews: [], hasMore: false, error: 'Unauthorized' };

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;

    const result = await safeSupabaseQuery<ReviewDB[]>(async () =>
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

    if (result.error || !result.data)
        return { reviews: [], hasMore: false, error: 'Failed to load reviews' };

    const rawReviews = result.data;
    const hasMore = rawReviews.length > PAGE_SIZE;
    const reviews = hasMore ? rawReviews.slice(0, PAGE_SIZE) : rawReviews;

    return { reviews, hasMore, error: null };
}

export async function deleteReviewAction(id: string | number): Promise<void> {
    const client = await createBackendClient();
    await client.from('book_reviews').delete().eq('id', id);
    revalidatePath('/user/content/reviews');
}
