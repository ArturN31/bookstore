import { renderHook, waitFor } from '@testing-library/react';
import { useUserListeners } from '@/providers/user/utils/useUserListeners';

describe('useUserListeners', () => {
    const mockSupabase = {
        auth: {
            getUser: jest.fn(),
            onAuthStateChange: jest.fn(),
        },
        channel: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue('channel-123'),
        removeChannel: jest.fn(),
    };

    const mockRouter = {
        push: jest.fn(),
        refresh: jest.fn(),
    };

    const mockSyncAllData = jest.fn();
    const mockRefreshProfile = jest.fn();
    const mockReset = jest.fn();
    const mockUnsubscribe = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase.auth.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: mockUnsubscribe } },
        });
    });

    it('should call getUser and syncAllData when no activeUserId on mount', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: null,
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        await waitFor(() => {
            expect(mockSupabase.auth.getUser).toHaveBeenCalled();
        });
    });

    it('should not call getUser when activeUserId exists on mount', async () => {
        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: 'user-123',
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        await waitFor(() => {
            expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
        });
    });

    it('should set up auth state listener', () => {
        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: null,
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should call syncAllData on SIGNED_IN event', async () => {
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;

        mockSupabase.auth.onAuthStateChange.mockImplementation((cb: any) => {
            authCallback = cb;
            return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: null,
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        if (authCallback) {
            await authCallback('SIGNED_IN', { user: { id: 'user-123' } });
        }

        expect(mockSyncAllData).toHaveBeenCalled();
    });

    it('should call syncAllData on USER_UPDATED event', async () => {
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;

        mockSupabase.auth.onAuthStateChange.mockImplementation((cb: any) => {
            authCallback = cb;
            return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: null,
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        if (authCallback) {
            await authCallback('USER_UPDATED', { user: { id: 'user-123' } });
        }

        expect(mockSyncAllData).toHaveBeenCalled();
    });

    it('should call reset and router methods on SIGNED_OUT event', async () => {
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;

        mockSupabase.auth.onAuthStateChange.mockImplementation((cb: any) => {
            authCallback = cb;
            return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: null,
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        if (authCallback) {
            await authCallback('SIGNED_OUT', null);
        }

        expect(mockReset).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/');
        expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it('should unsubscribe auth listener on unmount', () => {
        const { unmount } = renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: null,
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        unmount();

        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should set up postgres channel when activeUserId exists', () => {
        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: 'user-123',
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        expect(mockSupabase.channel).toHaveBeenCalledWith('user_changes_user-123');
        expect(mockSupabase.on).toHaveBeenCalled();
        expect(mockSupabase.subscribe).toHaveBeenCalled();
    });

    it('should not set up postgres channel when no activeUserId', () => {
        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: null,
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should call refreshProfile when postgres change event fires', () => {
        let callback: (() => void) | null = null;

        mockSupabase.on.mockImplementation((event: string, config: any, cb: () => void) => {
            callback = cb;
            return mockSupabase;
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: 'user-123',
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        if (callback) {
            callback();
        }

        expect(mockRefreshProfile).toHaveBeenCalled();
    });

    it('should remove postgres channel on unmount', () => {
        const { unmount } = renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: 'user-123',
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        unmount();

        expect(mockSupabase.removeChannel).toHaveBeenCalledWith('channel-123');
    });

    it('should listen for all events on users table', () => {
        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as any,
                activeUserId: 'user-123',
                router: mockRouter as any,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            })
        );

        expect(mockSupabase.on).toHaveBeenCalledWith(
            'postgres_changes',
            expect.objectContaining({
                event: '*',
                table: 'users',
                filter: 'id=eq.user-123',
            }),
            expect.any(Function)
        );
    });
});
