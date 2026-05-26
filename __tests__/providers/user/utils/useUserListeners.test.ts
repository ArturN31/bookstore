import { renderHook, waitFor } from '@testing-library/react';
import { SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useUserListeners } from '@/providers/user/utils/useUserListeners';

// Define a type-safe mock interface to avoid using 'any'
interface MockSupabaseClient {
    auth: {
        getUser: jest.Mock<Promise<{ data: { user: User | null }; error: Error | null }>>;
        onAuthStateChange: jest.Mock<{ data: { subscription: { unsubscribe: jest.Mock } } }>;
    };
    channel: jest.Mock<MockSupabaseClient>;
    on: jest.Mock<MockSupabaseClient>;
    subscribe: jest.Mock<string>;
    removeChannel: jest.Mock<void>;
}

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
    } as unknown as MockSupabaseClient;

    const mockRouter = {
        push: jest.fn(),
        refresh: jest.fn(),
    } as unknown as AppRouterInstance;

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
            data: { user: { id: 'user-123' } as User },
            error: null,
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as unknown as SupabaseClient,
                activeUserId: null,
                router: mockRouter,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            }),
        );

        await waitFor(() => {
            expect(mockSupabase.auth.getUser).toHaveBeenCalled();
            expect(mockSyncAllData).toHaveBeenCalled();
        });
    });

    it('should not call getUser when activeUserId exists on mount', async () => {
        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as unknown as SupabaseClient,
                activeUserId: 'user-123',
                router: mockRouter,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            }),
        );

        await waitFor(() => {
            expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
        });
    });

    it('should call syncAllData with session user on SIGNED_IN event', async () => {
        let authCallback:
            | ((event: AuthChangeEvent, session: Session | null) => Promise<void>)
            | undefined;

        mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
            authCallback = cb;
            return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as unknown as SupabaseClient,
                activeUserId: null,
                router: mockRouter,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            }),
        );

        if (authCallback) {
            const mockUser = { id: 'user-123' } as User;
            await authCallback('SIGNED_IN', { user: mockUser } as Session);
        }

        expect(mockSyncAllData).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-123' }));
    });

    it('should call syncAllData(null) when session is missing on SIGNED_IN event', async () => {
        let authCallback:
            | ((event: AuthChangeEvent, session: Session | null) => Promise<void>)
            | undefined;

        mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
            authCallback = cb;
            return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as unknown as SupabaseClient,
                activeUserId: null,
                router: mockRouter,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            }),
        );

        if (authCallback) {
            await authCallback('SIGNED_IN', null);
        }

        expect(mockSyncAllData).toHaveBeenCalledWith(null);
    });

    it('should call reset and router methods on SIGNED_OUT event', async () => {
        let authCallback:
            | ((event: AuthChangeEvent, session: Session | null) => Promise<void>)
            | undefined;

        mockSupabase.auth.onAuthStateChange.mockImplementation((cb) => {
            authCallback = cb;
            return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as unknown as SupabaseClient,
                activeUserId: null,
                router: mockRouter,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            }),
        );

        if (authCallback) {
            await authCallback('SIGNED_OUT', null);
        }

        expect(mockReset).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/');
        expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it('should call refreshProfile when postgres change event fires', () => {
        let callback: (() => void) | undefined;

        mockSupabase.on.mockImplementation((_event, _config, cb) => {
            callback = cb;
            return mockSupabase;
        });

        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as unknown as SupabaseClient,
                activeUserId: 'user-123',
                router: mockRouter,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            }),
        );

        if (callback) {
            callback();
        }

        expect(mockRefreshProfile).toHaveBeenCalled();
    });

    it('should listen for all events on users table', () => {
        renderHook(() =>
            useUserListeners({
                supabase: mockSupabase as unknown as SupabaseClient,
                activeUserId: 'user-123',
                router: mockRouter,
                syncAllData: mockSyncAllData,
                refreshProfile: mockRefreshProfile,
                reset: mockReset,
            }),
        );

        expect(mockSupabase.on).toHaveBeenCalledWith(
            'postgres_changes',
            expect.objectContaining({
                event: '*',
                table: 'users',
                filter: 'id=eq.user-123',
            }),
            expect.any(Function),
        );
    });
});
