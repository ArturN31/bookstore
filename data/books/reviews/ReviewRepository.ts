import { SupabaseClient } from '@supabase/supabase-js';
import { ReviewInsert } from './ReviewConstants';

export async function insertUserReview(supabase: SupabaseClient, payload: ReviewInsert) {
    return await supabase.from('book_reviews').insert({
        book_id: payload.book_id,
        user_id: payload.user_id,
        username: payload.username,
        rating: payload.rating,
        review: payload.review,
    });
}
