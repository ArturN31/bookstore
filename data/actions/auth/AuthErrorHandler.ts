import { AuthError } from '@supabase/supabase-js';

const ERROR_CODE_MAP: Record<string, string> = {
    invalid_credentials: 'Sign in credentials not recognised.',
    user_not_found: 'The account for this request no longer exists.',
    weak_password: 'The new password does not meet security requirements.',
    email_not_confirmed: 'Please verify your email address before signing in.',
    too_many_requests: 'Too many attempts. Please try again later.',
};

const ERROR_MESSAGE_PATTERNS = [
    {
        test: (msg: string) => msg.includes('reauthentication') || msg.includes('recent login'),
        response: 'Security timeout: Please sign out and back in to change your password.',
    },
    {
        test: (msg: string) => msg.includes('invalid claim') || msg.includes('expired'),
        response: 'Your session has expired. Please log in again.',
    },
];

export const mapAuthErrorToMessage = (error: AuthError | null): string => {
    if (!error) return 'An unexpected authentication error occurred.';

    if (error.code && ERROR_CODE_MAP[error.code]) return ERROR_CODE_MAP[error.code];

    const normalizedMessage = error.message?.toLowerCase() || '';
    const patternMatch = ERROR_MESSAGE_PATTERNS.find((p) => p.test(normalizedMessage));

    if (patternMatch) return patternMatch.response;

    return error.message || 'Authentication request failed.';
};
