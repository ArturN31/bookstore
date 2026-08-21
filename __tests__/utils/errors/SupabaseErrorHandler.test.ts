import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { AuthError } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
    AuthError: class MockAuthError extends Error {
        status?: number;
        constructor(message: string, status?: number) {
            super(message);
            this.name = 'AuthApiError';
            this.status = status;
        }
    },
}));

describe('SupabaseErrorHandler Routing', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Basic Validations', () => {
        it('should return default message for falsy error values', () => {
            expect(sanitizeSupabaseError(null)).toBe('An unknown error occurred.');
            expect(sanitizeSupabaseError(undefined)).toBe('An unknown error occurred.');
            expect(sanitizeSupabaseError(false)).toBe('An unknown error occurred.');
        });

        it('should return the string itself if it is non-empty', () => {
            expect(sanitizeSupabaseError('Custom error message')).toBe('Custom error message');
        });

        it('should return default message if the string is empty or whitespace only', () => {
            expect(sanitizeSupabaseError('')).toBe('An unknown error occurred.');
            expect(sanitizeSupabaseError('   ')).toBe('An unknown error occurred.');
        });
    });

    describe('Delegation to Specific Handlers', () => {
        it('should route to handlePostgrestError when payload matches isPostgrestError', () => {
            const mockPostgrestError = {
                code: '23505',
                details: 'Key (email)=(test@example.com) already exists.',
            };
            const result = sanitizeSupabaseError(mockPostgrestError);

            expect(result).toBe('This record already exists. Please use a different value.');
        });

        it('should route to handleAuthError when payload matches isAuthError', () => {
            const authErrorInstance = new AuthError('Token expired', 401);
            const result = sanitizeSupabaseError(authErrorInstance);

            expect(result).toBe('You are not authorized to perform this action. Please log in.');
        });
    });

    describe('Standard and Generic Error Fallbacks', () => {
        it('should catch and genericize standard Error instances', () => {
            const standardError = new Error('Stripe API Key expired');
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
                message: 'Some internal details',
            };
            const result = sanitizeSupabaseError(genericError);
            expect(result).toBe(
                'Security timeout: Please sign out and back in to change your password.',
            );
        });

        it('should return the message property if generic object provides a valid string message', () => {
            const genericError = {
                message: 'A custom server constraint failed',
            };
            const result = sanitizeSupabaseError(genericError);
            expect(result).toBe('A custom server constraint failed');
        });

        it('should handle completely unknown exception types gracefully', () => {
            const unknownError = { strange: 'object', metadata: 123 };
            const result = sanitizeSupabaseError(unknownError);

            expect(result).toBe('An unknown error occurred. Please try again later.');
            expect(consoleErrorSpy).toHaveBeenCalledWith('[Unknown Error]:', unknownError);
        });
    });

    describe('Try/Catch Block Delegation', () => {
        it('should return fallbackErrorMessage when an exception is thrown inside the try block', () => {
            const throwingErrorObject: Record<string, unknown> = {
                message: 'Object fallback message',
                get code(): string {
                    throw new Error('Property getter exception');
                },
            };

            const result = sanitizeSupabaseError(throwingErrorObject);

            expect(result).toBe('Object fallback message');
        });
    });
});
