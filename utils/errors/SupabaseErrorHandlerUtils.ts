import { AuthError } from '@supabase/supabase-js';
import {
    AUTH_CODE_MAP,
    AUTH_STATUS_MAP,
    DB_ERROR_MAP,
    APP_ERROR_MESSAGES,
} from './ErrorHandlerConstants';

export interface PostgrestErrorPayload {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
}

export interface AuthErrorPayload {
    name?: string;
    message?: string;
    status?: number;
    code?: string;
}

export interface GenericErrorPayload {
    code?: string;
    message?: string;
}

export const fallbackErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) return message;
    }
    return 'An unexpected error occurred.';
};

export const isPostgrestError = (error: unknown): error is PostgrestErrorPayload => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (('details' in error && typeof (error as PostgrestErrorPayload).details === 'string') ||
            ('hint' in error && typeof (error as PostgrestErrorPayload).hint === 'string'))
    );
};

export const isAuthError = (error: unknown): error is AuthErrorPayload => {
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
                !!AUTH_CODE_MAP[(error as AuthErrorPayload).code!]));

    return isAuthErrorInstance || isAuthErrorObject;
};

export const handlePostgrestError = (dbErr: PostgrestErrorPayload): string => {
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
};

export const handleAuthError = (authErr: AuthErrorPayload): string => {
    if (authErr.code && AUTH_CODE_MAP[authErr.code]) return AUTH_CODE_MAP[authErr.code];
    if (authErr.status && AUTH_STATUS_MAP[authErr.status]) return AUTH_STATUS_MAP[authErr.status];
    return 'An authentication error occurred. Please try again or log in again.';
};
