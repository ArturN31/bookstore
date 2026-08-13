'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { reviewSchema } from '@/data/schemas/reviewSchema';
import { createBackendClient } from '@/utils/db/server';
import { mapToReviewPayload } from './ReviewMapper';
import { insertUserReview } from './ReviewRepository';
import { REVIEW_ROUTES, ReviewInsert } from './ReviewConstants';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { isDuplicateReviewError, resolveUsername } from './ReviewActionUtils';

export type ReviewFormState = {
    validationErrors?: z.core.$ZodIssue[];
    message?: string | null;
};

const INITIAL_STATE: ReviewFormState = {
    message: null,
    validationErrors: undefined,
};

export async function UserReviewAction(
    prevState: ReviewFormState | undefined,
    formData: FormData,
): Promise<ReviewFormState> {
    const rawData = Object.fromEntries(formData.entries());

    if (rawData.reset) return INITIAL_STATE;

    const bookId = typeof rawData.bookId === 'string' ? rawData.bookId : '';
    if (!bookId) {
        return { message: APP_ERROR_MESSAGES.VALIDATION_ERROR };
    }

    const reviewId =
        typeof rawData.reviewId === 'string' && rawData.reviewId.trim() !== ''
            ? rawData.reviewId
            : undefined;
    const isEditing = Boolean(reviewId);

    const validated = reviewSchema.safeParse(rawData);
    if (!validated.success) {
        return {
            validationErrors: validated.error.issues,
            message: APP_ERROR_MESSAGES.VALIDATION_ERROR,
        };
    }

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

            const insertResult = await safeSupabaseQuery(async () =>
                insertUserReview(supabase, payload),
            );

            if (insertResult.error) {
                const isDuplicate = isDuplicateReviewError(null, insertResult.error);

                console.error('[UserReviewAction] Failed to insert user review data:', {
                    sanitizedError: insertResult.error,
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

    const bookPageRoute = REVIEW_ROUTES.BOOK_PAGE.replace('[id]', bookId);

    revalidatePath(bookPageRoute);
    revalidatePath(REVIEW_ROUTES.HOMEPAGE);
    revalidatePath('/user/content/reviews');

    if (isEditing) {
        return INITIAL_STATE;
    }

    redirect(bookPageRoute);
}
