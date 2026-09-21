import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import {
    fetchPublicUserProfileByUsername,
    fetchUserPrivacySettingsById,
    UpdatePrivacySettingsPayload,
    updateUserPrivacySettingsById,
} from '@/data/user/profile/PrivacySettingsRepository';

describe('PrivacySettingsRepository', () => {
    let mockSupabase: jest.Mocked<SupabaseClient<Database>>;

    beforeEach(() => {
        mockSupabase = {
            rpc: jest.fn(),
            from: jest.fn(),
        } as unknown as jest.Mocked<SupabaseClient<Database>>;
    });

    describe('fetchPublicUserProfileByUsername', () => {
        it('calls get_public_profile RPC with correct parameter', async () => {
            const mockMaybeSingle = jest.fn().mockResolvedValue({
                data: { id: 'user-1', username: 'testuser' },
                error: null,
            });
            (mockSupabase.rpc as jest.Mock).mockReturnValue({
                maybeSingle: mockMaybeSingle,
            });

            const result = await fetchPublicUserProfileByUsername(mockSupabase, 'testuser');

            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_public_profile', {
                target_username: 'testuser',
            });
            expect(mockMaybeSingle).toHaveBeenCalled();
            expect(result).toEqual({
                data: { id: 'user-1', username: 'testuser' },
                error: null,
            });
        });
    });

    describe('fetchUserPrivacySettingsById', () => {
        it('queries users table with correct selection and filters by user id', async () => {
            const mockMaybeSingle = jest.fn().mockResolvedValue({
                data: {
                    is_profile_public: true,
                    is_wishlist_public: false,
                    are_reviews_public: true,
                    wishlist_share_token: 'token-123',
                },
                error: null,
            });
            const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
            const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
            (mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

            const result = await fetchUserPrivacySettingsById(mockSupabase, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockSelect).toHaveBeenCalledWith(
                'is_profile_public, is_wishlist_public, are_reviews_public, wishlist_share_token',
            );
            expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
            expect(result).toEqual({
                data: {
                    is_profile_public: true,
                    is_wishlist_public: false,
                    are_reviews_public: true,
                    wishlist_share_token: 'token-123',
                },
                error: null,
            });
        });
    });

    describe('updateUserPrivacySettingsById', () => {
        it('updates users table with payload matching specified user id', async () => {
            const mockEq = jest.fn().mockResolvedValue({ error: null });
            const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
            (mockSupabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

            const payload: UpdatePrivacySettingsPayload = {
                is_profile_public: false,
                updated_at: '2026-01-01T00:00:00.000Z',
            };

            const result = await updateUserPrivacySettingsById(mockSupabase, 'user-123', payload);

            expect(mockSupabase.from).toHaveBeenCalledWith('users');
            expect(mockUpdate).toHaveBeenCalledWith(payload);
            expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
            expect(result).toEqual({ error: null });
        });
    });
});
