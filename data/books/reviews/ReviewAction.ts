'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { reviewSchema } from '@/data/schemas/reviewSchema';
import { createBackendClient } from '@/utils/db/server';
import { mapToReviewPayload } from './ReviewMapper';
import { insertUserReview } from './ReviewRepository';
import { REVIEW_ROUTES, ReviewInsert } from './ReviewConstants';
import { APP_ERROR_MESSAGES, DB_ERROR_MAP } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

export type ReviewFormState = {
    validationErrors?: z.core.$ZodIssue[];
    message?: string | null;
};

interface UserTableRow {
    username: string | null;
}

const INITIAL_STATE: ReviewFormState = {
    message: null,
    validationErrors: undefined,
};

function isDuplicateReviewError(dbError: unknown, sanitizedError: string): boolean {
    if (sanitizedError === DB_ERROR_MAP['23505']) {
        return true;
    }

    if (typeof dbError === 'object' && dbError !== null) {
        const errObj = dbError as { code?: unknown; message?: unknown; details?: unknown };
        if (typeof errObj.code === 'string' && errObj.code === '23505') {
            return true;
        }
        if (
            typeof errObj.message === 'string' &&
            (errObj.message.includes('23505') || errObj.message.toLowerCase().includes('duplicate'))
        ) {
            return true;
        }
        if (
            typeof errObj.details === 'string' &&
            (errObj.details.includes('23505') || errObj.details.toLowerCase().includes('duplicate'))
        ) {
            return true;
        }
    }

    if (typeof dbError === 'string') {
        return dbError.includes('23505') || dbError.toLowerCase().includes('duplicate');
    }

    return false;
}

export async function UserReviewAction(
    prevState: ReviewFormState | undefined,
    formData: FormData,
): Promise<ReviewFormState> {
    const rawData = Object.fromEntries(formData.entries());

    if (rawData.reset) return INITIAL_STATE;

    const bookId = typeof rawData.bookId === 'string' ? rawData.bookId : '';
    if (!bookId) {
        return {
            message: APP_ERROR_MESSAGES.VALIDATION_ERROR,
        };
    }

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

        let username = typeof rawData.username === 'string' ? rawData.username.trim() : '';

        if (!username) {
            const { data: userRecord } = await supabase
                .from('users')
                .select('username')
                .eq('id', user.id)
                .maybeSingle<UserTableRow>();

            username =
                userRecord?.username?.trim() ||
                (typeof user.user_metadata?.username === 'string'
                    ? user.user_metadata.username.trim()
                    : '') ||
                user.email?.split('@')[0] ||
                'Anonymous';
        }

        const mappedPayload = mapToReviewPayload(validated.data, bookId);
        const payload: ReviewInsert = {
            user_id: user.id,
            username,
            ...mappedPayload,
        };

        const { error: dbError } = await insertUserReview(supabase, payload);

        if (dbError) {
            const sanitizedError = sanitizeSupabaseError(dbError, user.id);
            const isDuplicate = isDuplicateReviewError(dbError, sanitizedError);

            console.error('[UserReviewAction] Failed to insert user review data:', {
                rawError: dbError,
                sanitizedError,
                isDuplicate,
            });

            return {
                message: isDuplicate
                    ? APP_ERROR_MESSAGES.ERROR_DUPLICATE_REVIEW
                    : APP_ERROR_MESSAGES.ERROR_REVIEW_SUBMIT_FAILED,
            };
        }
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
        console.error('[UserReviewAction] Critical Failure:', err);
        return { message: sanitizeSupabaseError(err) };
    }

    const bookPageRoute = REVIEW_ROUTES.BOOK_PAGE.replace('[id]', bookId);

    revalidatePath(bookPageRoute);
    revalidatePath(REVIEW_ROUTES.HOMEPAGE);
    redirect(bookPageRoute);
}
