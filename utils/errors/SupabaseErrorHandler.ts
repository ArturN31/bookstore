import { AuthError, PostgrestError } from '@supabase/supabase-js';

export const isPostgrestError = (error: unknown): error is PostgrestError => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        'details' in error
    );
};

export const isAuthError = (error: unknown): error is AuthError => {
    return (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        'message' in error &&
        'name' in error &&
        typeof (error as Record<string, unknown>).name === 'string' &&
        ((error as Record<string, unknown>).name as string).startsWith('Auth')
    );
};

export const sanitizeSupabaseError = (error: unknown): string => {
    if (isPostgrestError(error)) {
        console.error('[Supabase DB Error]:', error.message, error.code, error.details);

        switch (error.code) {
            case '23505':
                return 'This record already exists. Please use a different value.';
            case '23503':
                return 'The requested operation cannot be completed because related data is missing.';
            case '23502':
                return 'Please fill in all required fields.';
            case '42P01':
            case '42703':
                return 'We encountered an issue processing your request. Please contact support.';
            case 'PGRST116':
                return 'Could not find the exact record requested.';
            case '22P02':
                return 'The provided information is incorrectly formatted.';
            default:
                return 'An unexpected database error occurred. Please try again later.';
        }
    }

    if (isAuthError(error)) {
        console.error('[Supabase Auth Error]:', error.message, error.status);

        switch (error.status) {
            case 400:
                return 'Invalid credentials or request. Please check your information and try again.';
            case 401:
                return 'You are not authorized to perform this action. Please log in.';
            case 403:
                return 'Access to this resource is forbidden.';
            case 422:
                return 'The provided authentication information is invalid.';
            case 429:
                return 'Too many requests. Please wait a moment before trying again.';
            default:
                return 'An authentication error occurred. Please try again or log in again.';
        }
    }

    if (error instanceof Error) {
        console.error('[Standard Error]:', error.message);
        return 'An unexpected error occurred. We are looking into it.';
    }

    console.error('[Unknown Error]:', error);
    return 'An unknown error occurred. Please try again later.';
};
