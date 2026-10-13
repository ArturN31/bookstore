'use server';

import { addressSchema, fullUserSchema } from '@/data/schemas/onboardingSchema';
import { createBackendClient } from '@/utils/db/server';
import { z } from 'zod';
import { mapToUserPayload } from './OnboardingMapper';
import { insertOnboardingRecord, updateOnboardingRecord } from './OnboardingRepository';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Database } from '@/database.types';
import { USER_ROUTES } from '../UserConstants';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { limiters, verifyRateLimit } from '@/utils/network/rateLimiter';

type UserInsert = Database['public']['Tables']['users']['Insert'];

export type OnboardingFormState = {
    message?: string | null;
    validationErrors?: z.core.$ZodIssue[];
    error?: string | null;
};

const INITIAL_EMPTY_STATE: OnboardingFormState = {
    message: null,
    validationErrors: undefined,
    error: null,
};

export async function OnboardingAction(
    mode: 'add' | 'update',
    prevState: OnboardingFormState,
    formData: FormData,
): Promise<OnboardingFormState> {
    const ip = await getAppClientIp();
    const rateLimit = await verifyRateLimit({
        identifier: `ip:${ip}`,
        limiter: limiters.userMutation,
        failClosed: true,
    });
    if (!rateLimit.success)
        return {
            message: 'Too many requests. Please try again in a moment.',
            error: 'Too many requests. Please try again in a moment.',
        };

    const rawData = Object.fromEntries(formData.entries());
    const redirectTo = formData.get('redirectTo') as string | null;

    if (rawData.reset) return INITIAL_EMPTY_STATE;

    const schema = mode === 'add' ? fullUserSchema : addressSchema;
    const validated = schema.safeParse(rawData);

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
                operation: `OnboardingAction_${mode}_auth_failed`,
                error: authError ? sanitizeSupabaseError(authError) : 'Session expired',
            });
            return { message: APP_ERROR_MESSAGES.SESSION_EXPIRED };
        }

        const userRateLimit = await verifyRateLimit({
            identifier: `user:${user.id}`,
            limiter: limiters.userMutation,
            failClosed: true,
        });
        if (!userRateLimit.success)
            return {
                message:
                    userRateLimit.error ??
                    'Too many onboarding requests. Please try again in a moment.',
                error: userRateLimit.error,
            };

        const payload = mapToUserPayload(validated.data);

        const { error: dbError } =
            mode === 'add'
                ? await insertOnboardingRecord(supabase, { id: user.id, ...payload } as UserInsert)
                : await updateOnboardingRecord(supabase, user.id, payload);

        if (dbError) {
            const sanitizedError = sanitizeSupabaseError(dbError);
            return {
                message: sanitizedError,
                error: sanitizedError,
            };
        }
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
        console.error('[OnboardingAction] Critical Failure:', err);
        const sanitizedError = sanitizeSupabaseError(err);
        return {
            message: sanitizedError,
            error: sanitizedError,
        };
    }

    const targetRoute = redirectTo && redirectTo.startsWith('/') ? redirectTo : USER_ROUTES.PROFILE;

    revalidatePath(targetRoute);
    redirect(targetRoute);
}
