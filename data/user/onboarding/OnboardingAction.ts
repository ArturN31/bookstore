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
    const rawData = Object.fromEntries(formData.entries());

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

    revalidatePath(USER_ROUTES.PROFILE);
    redirect(USER_ROUTES.PROFILE);
}
