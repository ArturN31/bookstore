import { AuthError } from '@supabase/supabase-js';

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

export const APP_ERROR_MESSAGES = {
    INVALID_USER_SESSION: 'User session is invalid.',
    MALFORMED_IDENTIFIER: 'Malformed identifier parameters.',
    INVALID_QUANTITY: 'Invalid quantity assignment.',
    UNAUTHORIZED_ACCESS: 'Unauthorized access token',
    UNAUTHENTICATED_USER: 'Unauthenticated user context',
    NO_DATA_RETURNED: 'No data returned.',
    FAILED_TO_CREATE_CART: 'Failed to create cart.',
    SESSION_IDENTIFICATION_FAILED: 'Session identification failed.',
    UNSUPPORTED_ACTION_TYPE: 'Unsupported action type.',
    ERROR_SUPABASE_FAILED: 'Supabase client is undefined.',
    ERROR_DATABASE_QUERY_FAILED: 'Database query failed.',
    ERROR_SYSTEM_ERROR: 'A system error occurred or connection timed out.',
    ERROR_AUTH_FAILED: 'User session not found.',
    ERROR_PROFILE_NOT_FOUND: 'User profile not found.',
    ERROR_PROFILE_FETCH_FAILED: 'Failed to retrieve profile data.',
    ERROR_WISHLIST_FETCH_FAILED: 'Could not load wishlist.',
    ERROR_WISHLIST_SYSTEM_ERROR: 'Failed to fetch wishlist due to network issues.',
    ERROR_WISHLIST_NOT_FOUND: 'Wishlist not found.',
    ERROR_MISSING_USER_ID: 'No user ID provided.',
    ERROR_EMAIL_NOT_FOUND: 'Email not found.',
    VALIDATION_ERROR: 'Please correct the highlighted errors.',
    SESSION_EXPIRED: 'Session expired. Please log in again.',
    SAVE_ADDRESS_ERROR: 'Failed to save address details.',
    USERNAME_VALIDATION_ERROR: 'Please resolve the validation errors.',
    CURRENT_USERNAME: 'This is already your current username.',
    USERNAME_TAKEN: 'This username is already taken.',
    USERNAME_EXISTS_DB_ERROR: 'This record already exists. Please use a different value.',
    INVALID_WISHLIST_REQUEST: 'Invalid wishlist request.',
    WISHLIST_LOGIN_REQUIRED: 'Login required to manage wishlist.',
    UNSUPPORTED_WISHLIST_ACTION: 'Unsupported wishlist action.',
} as const;

export const DB_ERROR_MAP: Record<string, string> = {
    '23505': 'This record already exists. Please use a different value.',
    '23503': 'The requested operation cannot be completed because related data is missing.',
    '23502': 'Please fill in all required fields.',
    '42P01': 'We encountered an issue processing your request. Please contact support.',
    '42703': 'We encountered an issue processing your request. Please contact support.',
    PGRST116: 'Could not find the exact record requested.',
    '22P02': 'The provided information is incorrectly formatted.',
} as const;

export const AUTH_STATUS_MAP: Record<number, string> = {
    400: 'Invalid credentials or request. Please check your information and try again.',
    401: 'You are not authorized to perform this action. Please log in.',
    403: 'Access to this resource is forbidden.',
    422: 'The provided authentication information is invalid.',
    429: 'Too many requests. Please wait a moment before trying again.',
} as const;

export const AUTH_CODE_MAP: Record<string, string> = {
    reauthentication_needed:
        'Security timeout: Please sign out and back in to change your password.',
    weak_password: 'The new password does not meet security requirements.',
} as const;

const fallbackErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) return message;
    }
    return 'An unexpected error occurred.';
};

export const sanitizeSupabaseError = (error: unknown): string => {
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
                ('status' in error && typeof (error as AuthErrorPayload).status === 'number'));

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
