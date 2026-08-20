import { AuthError } from '@supabase/supabase-js';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import {
    fallbackErrorMessage,
    isPostgrestError,
    isAuthError,
    handlePostgrestError,
    handleAuthError,
} from '@/utils/errors/SupabaseErrorHandlerUtils';

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

describe('SupabaseErrorHandlerUtils', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Type Guards', () => {
        describe('isPostgrestError', () => {
            it('should return true for valid PostgREST error payload with details', () => {
                expect(isPostgrestError({ code: '23505', details: 'some detail' })).toBe(true);
            });

            it('should return true for valid PostgREST error payload with hint', () => {
                expect(isPostgrestError({ code: '99999', hint: 'some hint' })).toBe(true);
            });

            it('should return false for invalid objects', () => {
                expect(isPostgrestError(null)).toBe(false);
                expect(isPostgrestError({ code: '23505' })).toBe(false); // Missing details or hint
                expect(isPostgrestError({ details: 'some detail' })).toBe(false); // Missing code
            });
        });

        describe('isAuthError', () => {
            it('should return true for an AuthError instance', () => {
                expect(isAuthError(new AuthError('msg', 400))).toBe(true);
            });

            it('should return true for objects with a name starting with Auth', () => {
                expect(isAuthError({ name: 'AuthApiError' })).toBe(true);
            });

            it('should return true for objects with a status number', () => {
                expect(isAuthError({ status: 401 })).toBe(true);
            });

            it('should return true for objects with a recognized auth code', () => {
                expect(isAuthError({ code: 'weak_password' })).toBe(true);
            });

            it('should return false for unrelated objects', () => {
                expect(isAuthError({ message: 'standard error' })).toBe(false);
                expect(isAuthError({ code: 'unrecognized_auth_code' })).toBe(false);
            });
        });
    });

    describe('handlePostgrestError', () => {
        it('should sanitize 23505 (unique_violation) error for username taken', () => {
            const mockPostgrestError = {
                code: '23505',
                message: 'duplicate key value violates unique constraint "users_username_key"',
                details: 'Key (username)=(testuser) already exists.',
            };
            const result = handlePostgrestError(mockPostgrestError);
            expect(result).toBe(APP_ERROR_MESSAGES.USERNAME_TAKEN);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should sanitize 23505 (unique_violation) error for general conflicts', () => {
            const mockPostgrestError = {
                code: '23505',
                message: 'duplicate key value violates unique constraint "users_email_key"',
                details: 'Key (email)=(test@example.com) already exists.',
            };
            const result = handlePostgrestError(mockPostgrestError);
            expect(result).toBe('This record already exists. Please use a different value.');
        });

        it('should sanitize 23503 (foreign_key_violation) error', () => {
            const result = handlePostgrestError({
                code: '23503',
                message: 'insert or update on table violates foreign key constraint',
                details: 'Key (author_id)=(999) is not present in table "authors".',
            });
            expect(result).toBe(
                'The requested operation cannot be completed because related data is missing.',
            );
        });

        it('should sanitize 23502 (not_null_violation) error', () => {
            const result = handlePostgrestError({ code: '23502' });
            expect(result).toBe('Please fill in all required fields.');
        });

        it('should sanitize 42P01 (undefined_table) error', () => {
            const result = handlePostgrestError({ code: '42P01' });
            expect(result).toBe(
                'We encountered an issue processing your request. Please contact support.',
            );
        });

        it('should sanitize 42703 (undefined_column) error', () => {
            const result = handlePostgrestError({ code: '42703' });
            expect(result).toBe(
                'We encountered an issue processing your request. Please contact support.',
            );
        });

        it('should sanitize PGRST116 (row not found) error', () => {
            const result = handlePostgrestError({ code: 'PGRST116' });
            expect(result).toBe('Could not find the exact record requested.');
        });

        it('should sanitize 22P02 (invalid_text_representation) error', () => {
            const result = handlePostgrestError({ code: '22P02' });
            expect(result).toBe('The provided information is incorrectly formatted.');
        });

        it('should sanitize unknown Postgrest error code to a generic message', () => {
            const result = handlePostgrestError({
                code: '99999',
                message: 'Internal server failure',
            });
            expect(result).toBe('An unexpected database error occurred. Please try again later.');
        });

        it('should handle PostgREST error with null message and details without throwing', () => {
            const mockPostgrestError: Record<string, unknown> = {
                code: '23505',
                message: null,
                details: null,
            };
            const result = handlePostgrestError(mockPostgrestError);
            expect(result).toBeDefined();
        });
    });

    describe('handleAuthError', () => {
        it('should handle specific auth error object matching by code', () => {
            const result = handleAuthError({ code: 'weak_password' });
            expect(result).toBe('The new password does not meet security requirements.');
        });

        it('should sanitize status 400 Auth errors', () => {
            const result = handleAuthError({ status: 400 });
            expect(result).toBe(
                'Invalid credentials or request. Please check your information and try again.',
            );
        });

        it('should sanitize status 401 Auth errors', () => {
            const result = handleAuthError({ status: 401 });
            expect(result).toBe('You are not authorized to perform this action. Please log in.');
        });

        it('should sanitize status 403 Auth errors', () => {
            const result = handleAuthError({ status: 403 });
            expect(result).toBe('Access to this resource is forbidden.');
        });

        it('should sanitize status 422 Auth errors', () => {
            const result = handleAuthError({ status: 422 });
            expect(result).toBe('The provided authentication information is invalid.');
        });

        it('should sanitize status 429 Auth errors', () => {
            const result = handleAuthError({ status: 429 });
            expect(result).toBe('Too many requests. Please wait a moment before trying again.');
        });

        it('should sanitize unrecognized Auth status code to the default message', () => {
            const result = handleAuthError({ status: 500 });
            expect(result).toBe(
                'An authentication error occurred. Please try again or log in again.',
            );
        });
    });

    describe('fallbackErrorMessage', () => {
        it('should return string input directly', () => {
            expect(fallbackErrorMessage('Fallback string message')).toBe('Fallback string message');
        });

        it('should return Error.message when an Error instance is passed', () => {
            const error = new Error('Error instance fallback message');
            expect(fallbackErrorMessage(error)).toBe('Error instance fallback message');
        });

        it('should return message property when error is an object with valid non-empty string message', () => {
            expect(fallbackErrorMessage({ message: 'Object fallback message' })).toBe(
                'Object fallback message',
            );
        });

        it('should return default fallback message when error object has empty or whitespace-only message property', () => {
            expect(fallbackErrorMessage({ message: '    ' })).toBe('An unexpected error occurred.');
        });

        it('should return default fallback message when error object has non-string message property', () => {
            expect(fallbackErrorMessage({ message: 500 })).toBe('An unexpected error occurred.');
        });

        it('should return default fallback message when error object does not have message property', () => {
            expect(fallbackErrorMessage({ someKey: 'value' })).toBe(
                'An unexpected error occurred.',
            );
        });
    });
});
