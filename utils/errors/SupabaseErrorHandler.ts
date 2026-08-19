import { AuthError } from '@supabase/supabase-js';
import {
    AUTH_CODE_MAP,
    AUTH_STATUS_MAP,
    DB_ERROR_MAP,
    APP_ERROR_MESSAGES,
} from './ErrorHandlerConstants';

interface PostgrestErrorPayload {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
}

interface AuthErrorPayload {
    name?: string;
    message?: string;
    status?: number;
    code?: string;
}

interface GenericErrorPayload {
    code?: string;
    message?: string;
}

const fallbackErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) return message;
    }
    return 'An unexpected error occurred.';
};

export const sanitizeSupabaseError = (error: unknown, userId?: string | null): string => {
    try {
        if (!error) return 'An unknown error occurred.';

        if (typeof error === 'string') {
            if (error.trim().length > 0) return error;
            return 'An unknown error occurred.';
        }

        const isPostgrestError =
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (('details' in error && typeof (error as PostgrestErrorPayload).details === 'string') ||
                ('hint' in error && typeof (error as PostgrestErrorPayload).hint === 'string'));

        if (isPostgrestError) {
            const dbErr = error as PostgrestErrorPayload;
            console.error('[Supabase DB Error]:', dbErr.message, dbErr.code, dbErr.details);

            if (dbErr.code === '23505') {
                const errorDetails = (dbErr.details ?? '').toLowerCase();
                const errorMessage = (dbErr.message ?? '').toLowerCase();
                if (
                    errorDetails.includes('username') ||
                    errorMessage.includes('users_username_key') ||
                    errorMessage.includes('username')
                ) {
                    return APP_ERROR_MESSAGES.USERNAME_TAKEN;
                }
            }

            if (dbErr.code && DB_ERROR_MAP[dbErr.code]) return DB_ERROR_MAP[dbErr.code];
            return 'An unexpected database error occurred. Please try again later.';
        }

        const isAuthErrorInstance = typeof AuthError === 'function' && error instanceof AuthError;
        const isAuthErrorObject =
            typeof error === 'object' &&
            error !== null &&
            (('name' in error &&
                typeof (error as AuthErrorPayload).name === 'string' &&
                (error as AuthErrorPayload).name?.startsWith('Auth')) ||
                ('status' in error && typeof (error as AuthErrorPayload).status === 'number') ||
                ('code' in error &&
                    typeof (error as AuthErrorPayload).code === 'string' &&
                    AUTH_CODE_MAP[(error as AuthErrorPayload).code!]));

        if (isAuthErrorInstance || isAuthErrorObject) {
            const authErr = error as AuthErrorPayload;

            if (authErr.code && AUTH_CODE_MAP[authErr.code]) return AUTH_CODE_MAP[authErr.code];
            if (authErr.status && AUTH_STATUS_MAP[authErr.status])
                return AUTH_STATUS_MAP[authErr.status];
            return 'An authentication error occurred. Please try again or log in again.';
        }

        if (error instanceof Error) {
            console.error('[Standard Error]:', error.message);
            return 'An unexpected error occurred. We are looking into it.';
        }

        const genericErr = error as GenericErrorPayload;
        if (
            typeof genericErr === 'object' &&
            genericErr !== null &&
            'code' in genericErr &&
            typeof genericErr.code === 'string' &&
            AUTH_CODE_MAP[genericErr.code]
        )
            return AUTH_CODE_MAP[genericErr.code];

        if (
            typeof genericErr === 'object' &&
            genericErr !== null &&
            'message' in genericErr &&
            typeof genericErr.message === 'string' &&
            genericErr.message.length > 0
        )
            return genericErr.message;

        console.error('[Unknown Error]:', error);
        return 'An unknown error occurred. Please try again later.';
    } catch {
        return fallbackErrorMessage(error);
    }
};
