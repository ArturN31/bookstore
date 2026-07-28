import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { AuthError } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
    AuthError: class MockAuthError extends Error {
        status?: number;
        code?: string;
        constructor(message: string, status?: number) {
            super(message);
            this.name = 'AuthApiError';
            this.status = status;
        }
    },
}));

describe('SupabaseErrorHandler', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('sanitizeSupabaseError', () => {
        it('should return default message for falsy error values', () => {
            expect(sanitizeSupabaseError(null)).toBe('An unknown error occurred.');
            expect(sanitizeSupabaseError(undefined)).toBe('An unknown error occurred.');
            expect(sanitizeSupabaseError('')).toBe('An unknown error occurred.');
            expect(sanitizeSupabaseError(false)).toBe('An unknown error occurred.');
        });

        describe('PostgREST Database Errors', () => {
            it('should sanitize 23505 (unique_violation) error', () => {
                const mockPostgrestError = {
                    code: '23505',
                    message: 'duplicate key value violates unique constraint "users_email_key"',
                    details: 'Key (email)=(test@example.com) already exists.',
                    hint: null,
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe('This record already exists. Please use a different value.');
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[Supabase DB Error]:',
                    mockPostgrestError.message,
                    mockPostgrestError.code,
                    mockPostgrestError.details,
                );
            });

            it('should recognize PostgREST error via hint when details is missing', () => {
                const mockPostgrestError = {
                    code: '99999',
                    message: 'Error with hint only',
                    hint: 'Check your query parameters',
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe(
                    'An unexpected database error occurred. Please try again later.',
                );
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            it('should sanitize 23503 (foreign_key_violation) error', () => {
                const mockPostgrestError = {
                    code: '23503',
                    message: 'insert or update on table violates foreign key constraint',
                    details: 'Key (author_id)=(999) is not present in table "authors".',
                    hint: null,
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe(
                    'The requested operation cannot be completed because related data is missing.',
                );
            });

            it('should sanitize 23502 (not_null_violation) error', () => {
                const mockPostgrestError = {
                    code: '23502',
                    message: 'null value in column "title" violates not-null constraint',
                    details: 'Failing row contains (1, null).',
                    hint: null,
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe('Please fill in all required fields.');
            });

            it('should sanitize 42P01 (undefined_table) error', () => {
                const mockPostgrestError = {
                    code: '42P01',
                    message: 'relation "non_existent_table" does not exist',
                    details: '',
                    hint: null,
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe(
                    'We encountered an issue processing your request. Please contact support.',
                );
            });

            it('should sanitize 42703 (undefined_column) error', () => {
                const mockPostgrestError = {
                    code: '42703',
                    message: 'column "non_existent" does not exist',
                    details: '',
                    hint: null,
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe(
                    'We encountered an issue processing your request. Please contact support.',
                );
            });

            it('should sanitize PGRST116 (row not found) error', () => {
                const mockPostgrestError = {
                    code: 'PGRST116',
                    message: 'JSON object requested, multiple (or no) rows returned',
                    details: '0 rows returned',
                    hint: null,
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe('Could not find the exact record requested.');
            });

            it('should sanitize 22P02 (invalid_text_representation) error', () => {
                const mockPostgrestError = {
                    code: '22P02',
                    message: 'invalid input syntax for type integer: "abc"',
                    details: '',
                    hint: null,
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe('The provided information is incorrectly formatted.');
            });

            it('should sanitize unknown Postgrest error code to a generic message', () => {
                const mockPostgrestError = {
                    code: '99999',
                    message: 'Internal server failure on node xy',
                    details: 'Connection dropped',
                    hint: null,
                };

                const result = sanitizeSupabaseError(mockPostgrestError);

                expect(result).toBe(
                    'An unexpected database error occurred. Please try again later.',
                );
            });
        });

        describe('Supabase Auth Errors', () => {
            it('should handle native AuthError instances correctly', () => {
                const authErrorInstance = new AuthError('Token expired', 401);

                const result = sanitizeSupabaseError(authErrorInstance);

                expect(result).toBe(
                    'You are not authorized to perform this action. Please log in.',
                );
            });

            it('should handle auth error object matching by name prefix without status', () => {
                const mockAuthError = {
                    name: 'AuthApiError',
                    message: 'Some auth error',
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe(
                    'An authentication error occurred. Please try again or log in again.',
                );
            });

            it('should handle auth error object matching by status number only', () => {
                const mockAuthError = {
                    status: 403,
                    message: 'Forbidden action',
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe('Access to this resource is forbidden.');
            });

            it('should sanitize status 400 Auth errors', () => {
                const mockAuthError = {
                    name: 'AuthApiError',
                    message: 'Invalid login credentials',
                    status: 400,
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe(
                    'Invalid credentials or request. Please check your information and try again.',
                );
            });

            it('should sanitize status 401 Auth errors', () => {
                const mockAuthError = {
                    name: 'AuthApiError',
                    message: 'JWT expired',
                    status: 401,
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe(
                    'You are not authorized to perform this action. Please log in.',
                );
            });

            it('should sanitize status 403 Auth errors', () => {
                const mockAuthError = {
                    name: 'AuthApiError',
                    message: 'User is disabled',
                    status: 403,
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe('Access to this resource is forbidden.');
            });

            it('should sanitize status 422 Auth errors', () => {
                const mockAuthError = {
                    name: 'AuthApiError',
                    message: 'Email provider disabled',
                    status: 422,
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe('The provided authentication information is invalid.');
            });

            it('should sanitize status 429 Auth errors', () => {
                const mockAuthError = {
                    name: 'AuthApiError',
                    message: 'Rate limit exceeded',
                    status: 429,
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe('Too many requests. Please wait a moment before trying again.');
            });

            it('should sanitize unrecognized Auth status code to the default message', () => {
                const mockAuthError = {
                    name: 'AuthUnknownError',
                    message: 'Internal Auth Server Error',
                    status: 500,
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe(
                    'An authentication error occurred. Please try again or log in again.',
                );
            });

            it('should sanitize auth error with recognized error code', () => {
                const mockAuthError = {
                    name: 'AuthApiError',
                    code: 'weak_password',
                    message: 'Password is too weak',
                    status: 400,
                };

                const result = sanitizeSupabaseError(mockAuthError);

                expect(result).toBe('The new password does not meet security requirements.');
            });
        });

        describe('Standard and Unknown Errors', () => {
            it('should catch and genericize standard Error instances', () => {
                const standardError = new Error('Stripe API Key sk_live_xyz expired');
                const result = sanitizeSupabaseError(standardError);

                expect(result).toBe('An unexpected error occurred. We are looking into it.');
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[Standard Error]:',
                    standardError.message,
                );
            });

            it('should handle generic error objects with a recognized auth code', () => {
                const genericError = {
                    code: 'reauthentication_needed',
                    message: 'Some error message',
                };

                const result = sanitizeSupabaseError(genericError);

                expect(result).toBe(
                    'Security timeout: Please sign out and back in to change your password.',
                );
            });

            it('should handle completely unknown exception types gracefully', () => {
                const unknownError = { strange: 'object', metadata: 123 };
                const result = sanitizeSupabaseError(unknownError);

                expect(result).toBe('An unknown error occurred. Please try again later.');
                expect(consoleErrorSpy).toHaveBeenCalledWith('[Unknown Error]:', unknownError);
            });
        });
    });
});
