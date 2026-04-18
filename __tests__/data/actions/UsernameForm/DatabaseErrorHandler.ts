import { handleUsernameUpdateError } from '@/data/actions/UsernameForm/DatabaseErrorHandler';

describe('DatabaseErrorHandler', () => {
    describe('handleUsernameUpdateError', () => {
        it('should return isUsernameTaken true for 23505 error code', () => {
            const error = { code: '23505', message: 'Unique violation', details: '', hint: '' };
            
            const result = handleUsernameUpdateError(error as any);
            
            expect(result.isUsernameTaken).toBe(true);
            expect(result.message).toBe('This username is already taken.');
        });

        it('should return isUsernameTaken false for other error codes', () => {
            const error = { code: '23503', message: 'FK violation', details: '', hint: '' };
            
            const result = handleUsernameUpdateError(error as any);
            
            expect(result.isUsernameTaken).toBe(false);
            expect(result.message).toBe('Failed to update username. Please try again later.');
        });

        it('should return the original error in result', () => {
            const error = { code: '23505', message: 'Unique violation', details: '', hint: '' };
            
            const result = handleUsernameUpdateError(error as any);
            
            expect(result.error).toEqual(error);
        });

        it('should handle empty error object', () => {
            const error = { code: undefined, message: '', details: '', hint: '' };
            
            const result = handleUsernameUpdateError(error as any);
            
            expect(result.isUsernameTaken).toBe(false);
        });
    });
});
