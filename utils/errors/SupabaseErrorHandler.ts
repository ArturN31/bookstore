import { AUTH_CODE_MAP } from './ErrorHandlerConstants';
import {
    GenericErrorPayload,
    fallbackErrorMessage,
    isPostgrestError,
    isAuthError,
    handlePostgrestError,
    handleAuthError,
} from './SupabaseErrorHandlerUtils';

export const sanitizeSupabaseError = (error: unknown, userId?: string | null): string => {
    try {
        if (!error) return 'An unknown error occurred.';

        if (typeof error === 'string') {
            if (error.trim().length > 0) return error;
            return 'An unknown error occurred.';
        }

        if (isPostgrestError(error)) return handlePostgrestError(error);

        if (isAuthError(error)) return handleAuthError(error);

        if (error instanceof Error) {
            console.error('[Standard Error]:', error.message);
            return 'An unexpected error occurred. We are looking into it.';
        }

        const genericErr = error as GenericErrorPayload;

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
