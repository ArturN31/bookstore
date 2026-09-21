'use server';

import { INITIAL_EMPTY_REVIEW_FORM_STATE, ReviewFormState, ReviewInsert } from './ReviewConstants';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { reviewSchema } from '@/data/schemas/reviewSchema';
import { createBackendClient } from '@/utils/db/server';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import {
    isDuplicateReviewError,
    resolveUsername,
    verifyReviewOwnership,
    revalidateReviewCaches,
} from './ReviewActionUtils';
import { mapToReviewPayload } from './ReviewMapper';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';

export async function UserReviewAction(
    prevState: ReviewFormState | undefined,
    formData: FormData,
): Promise<ReviewFormState> {
    const rawData = Object.fromEntries(formData.entries());

    if (rawData.reset) return INITIAL_EMPTY_REVIEW_FORM_STATE;

    const bookId: string = typeof rawData.bookId === 'string' ? rawData.bookId : '';
    const slug: string =
        typeof rawData.slug === 'string' && rawData.slug.trim() !== '' ? rawData.slug : bookId;
    if (!bookId) return { message: APP_ERROR_MESSAGES.VALIDATION_ERROR };

    const reviewId =
        typeof rawData.reviewId === 'string' && rawData.reviewId.trim() !== ''
            ? rawData.reviewId
            : undefined;

    const isEditing = Boolean(reviewId);

    const validated = reviewSchema.safeParse(rawData);
    if (!validated.success)
        return {
            validationErrors: validated.error.issues,
            message: APP_ERROR_MESSAGES.VALIDATION_ERROR,
        };

    try {
        const supabase = await createBackendClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
                operation: 'UserReviewAction_auth_failed',
                error: authError ? sanitizeSupabaseError(authError) : 'Session expired',
            });
            return { message: APP_ERROR_MESSAGES.SESSION_EXPIRED };
        }

        const rawUsername = typeof rawData.username === 'string' ? rawData.username : undefined;
        const username = await resolveUsername(supabase, user, rawUsername);
        const mappedPayload = mapToReviewPayload(validated.data, bookId);

        if (isEditing && reviewId) {
            const isAuthorized = await verifyReviewOwnership(supabase, reviewId, user.id);
            if (!isAuthorized) return { message: APP_ERROR_MESSAGES.ERROR_REVIEW_SUBMIT_FAILED };

            const updateResult = await safeSupabaseQuery<{ id: string | number }[]>(async () =>
                supabase
                    .from('book_reviews')
                    .update({
                        ...mappedPayload,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', reviewId)
                    .eq('user_id', user.id)
                    .select('id'),
            );

            if (updateResult.error || !updateResult.data || updateResult.data.length === 0) {
                console.error('[UserReviewAction] Failed to update user review data:', {
                    sanitizedError:
                        updateResult.error ?? 'No matching review record found to update.',
                    reviewId,
                    userId: user.id,
                });
                return { message: APP_ERROR_MESSAGES.ERROR_REVIEW_SUBMIT_FAILED };
            }
        } else {
            const payload: ReviewInsert = {
                user_id: user.id,
                username,
                ...mappedPayload,
            };

            const insertResult = await safeSupabaseQuery<{ id: string | number }[]>(async () =>
                supabase.from('book_reviews').insert(payload).select('id'),
            );

            if (insertResult.error || !insertResult.data || insertResult.data.length === 0) {
                const errorMsg = insertResult.error ?? '';
                const isDuplicate = isDuplicateReviewError(errorMsg, errorMsg);

                console.error('[UserReviewAction] Failed to insert user review data:', {
                    sanitizedError: insertResult.error ?? 'No data returned from insert.',
                    isDuplicate,
                });

                return {
                    message: isDuplicate
                        ? APP_ERROR_MESSAGES.ERROR_DUPLICATE_REVIEW
                        : APP_ERROR_MESSAGES.ERROR_REVIEW_SUBMIT_FAILED,
                };
            }
        }
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
        console.error('[UserReviewAction] Critical Failure:', err);
        return { message: sanitizeSupabaseError(err) };
    }

    revalidateReviewCaches(bookId, slug);
    return INITIAL_EMPTY_REVIEW_FORM_STATE;
}
