import { AuthError } from '@supabase/supabase-js';
import { mapAuthErrorToMessage } from '@/data/actions/auth/AuthErrorHandler';

describe('mapAuthErrorToMessage', () => {
    it('should return default unexpected message when error argument is null', () => {
        const result = mapAuthErrorToMessage(null);
        expect(result).toBe('An unexpected authentication error occurred.');
    });

    it('should map a known error code to its human-readable message', () => {
        const error = {
            name: 'AuthError',
            message: 'Some internal message',
            status: 400,
            code: 'invalid_credentials',
        } as AuthError;

        const result = mapAuthErrorToMessage(error);
        expect(result).toBe('Sign in credentials not recognised.');
    });

    it('should map a message containing recent login or reauthentication patterns', () => {
        const error = {
            name: 'AuthError',
            message: 'User requires reauthentication to proceed',
            status: 403,
        } as AuthError;

        const result = mapAuthErrorToMessage(error);
        expect(result).toBe(
            'Security timeout: Please sign out and back in to change your password.',
        );
    });

    it('should map a message containing invalid claim or expired patterns', () => {
        const error = {
            name: 'AuthError',
            message: 'The jwt token has expired',
            status: 401,
        } as AuthError;

        const result = mapAuthErrorToMessage(error);
        expect(result).toBe('Your session has expired. Please log in again.');
    });

    it('should return the raw error message if code is unknown and patterns do not match', () => {
        const error = {
            name: 'AuthError',
            message: 'Something brand new went wrong',
            status: 400,
            code: 'completely_unknown_code',
        } as AuthError;

        const result = mapAuthErrorToMessage(error);
        expect(result).toBe('Something brand new went wrong');
    });

    it('BRANCH COVERAGE: should fall back to default request failed message when error.message is missing or empty (covers line 23 fallback)', () => {
        const error = {
            name: 'AuthError',
            message: '',
            status: 400,
            code: undefined,
        } as AuthError;

        const result = mapAuthErrorToMessage(error);
        expect(result).toBe('Authentication request failed.');
    });
});
