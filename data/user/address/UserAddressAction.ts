'use server';

import { addressSchema, fullUserSchema } from '@/data/schemas/addressSchema';
import { createBackendClient } from '@/utils/db/server';
import { z } from 'zod';
import { mapToUserPayload } from './UserAddressMapper';
import { insertUserAddress, updateUserAddress } from './UserAddressRepository';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Database } from '@/database.types';
import { USER_ROUTES } from '../UserConstants';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

type UserInsert = Database['public']['Tables']['users']['Insert'];

export type UserAddressFormState = {
    message?: string | null;
    validationErrors?: z.ZodIssue[];
    error?: string | null;
};

const INITIAL_EMPTY_STATE: UserAddressFormState = {
    message: null,
    validationErrors: undefined,
    error: null,
};

export async function UserAddressAction(
    mode: 'add' | 'update',
    prevState: UserAddressFormState,
    formData: FormData,
): Promise<UserAddressFormState> {
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
                operation: `UserAddressAction_${mode}_auth_failed`,
                error: authError ? sanitizeSupabaseError(authError) : 'Session expired',
            });
            return { message: APP_ERROR_MESSAGES.SESSION_EXPIRED };
        }

        const payload = mapToUserPayload(validated.data);

        const { error: dbError } =
            mode === 'add'
                ? await insertUserAddress(supabase, { id: user.id, ...payload } as UserInsert)
                : await updateUserAddress(supabase, user.id, payload);

        if (dbError) {
            const sanitizedError = sanitizeSupabaseError(dbError);
            void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', user.id, {
                operation: `UserAddressAction_${mode}_db_error`,
                error: sanitizedError,
            });
            return {
                message: APP_ERROR_MESSAGES.SAVE_ADDRESS_ERROR,
                error: sanitizedError,
            };
        }
    } catch (err: unknown) {
        const sanitizedError = sanitizeSupabaseError(err);
        void recordSecurityAuditLog('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
            operation: `UserAddressAction_${mode}_exception`,
            error: sanitizedError,
        });
        return {
            message: APP_ERROR_MESSAGES.SAVE_ADDRESS_ERROR,
            error: sanitizedError,
        };
    }

    revalidatePath(USER_ROUTES.PROFILE);
    redirect(USER_ROUTES.PROFILE);
}
