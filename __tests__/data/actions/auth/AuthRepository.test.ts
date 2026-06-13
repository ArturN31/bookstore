import { SupabaseClient } from '@supabase/supabase-js';
import {
    updateAccountPassword,
    terminateSession,
    authenticateUser,
    registerUser,
} from '@/data/actions/auth/AuthRepository';

describe('AuthRepository', () => {
    let mockSupabase: { auth: Record<string, jest.Mock> };

    beforeEach(() => {
        mockSupabase = {
            auth: {
                updateUser: jest.fn(),
                signOut: jest.fn(),
                signInWithPassword: jest.fn(),
                signUp: jest.fn(),
            },
        };
    });

    it('should call updateUser with password', async () => {
        mockSupabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });
        const result = await updateAccountPassword(
            mockSupabase as unknown as SupabaseClient,
            'new-password',
        );

        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
        expect(result.error).toBeNull();
    });

    it('should call signOut', async () => {
        mockSupabase.auth.signOut.mockResolvedValue({ error: null });
        const result = await terminateSession(mockSupabase as unknown as SupabaseClient);

        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(result.error).toBeNull();
    });

    it('should call signInWithPassword with credentials', async () => {
        const credentials = { email: 'test@test.com', password: 'password' };
        mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

        const result = await authenticateUser(
            mockSupabase as unknown as SupabaseClient,
            credentials,
        );

        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
        expect(result.error).toBeNull();
    });

    it('should call signUp with credentials', async () => {
        const credentials = { email: 'test@test.com', password: 'password' };
        mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: null });

        const result = await registerUser(mockSupabase as unknown as SupabaseClient, credentials);

        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(credentials);
        expect(result.error).toBeNull();
    });

    it('should handle repository errors (covers line 27-31 branches)', async () => {
        const error = { message: 'Failed' };
        mockSupabase.auth.signUp.mockResolvedValue({ data: null, error });

        const result = await registerUser(mockSupabase as unknown as SupabaseClient, {
            email: 'test@test.com',
            password: 'password',
        });

        expect(result.error).toEqual(error);
    });
});
