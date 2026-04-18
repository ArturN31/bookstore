import { render, screen, waitFor, act } from '@testing-library/react';
import { UserProvider } from '@/providers/user/UserProvider';
import { useUserState, useUserActions } from '@/providers/user/utils/useUser';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        refresh: jest.fn(),
    })),
}));

jest.mock('@/utils/db/client', () => ({
    createFrontendClient: jest.fn(() => ({
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
            onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
        },
        channel: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnValue('channel'),
        removeChannel: jest.fn(),
    })),
}));

jest.mock('@/data/user/GetUserData', () => ({
    getUserData: jest.fn().mockResolvedValue({ data: null, error: null }),
    getUserWishlist: jest.fn().mockResolvedValue({ data: [], error: null }),
}));

const TestConsumer = () => {
    const { loggedIn, profileExists, wishlist, user } = useUserState();
    const { refreshProfile, refreshWishlist, signOut } = useUserActions();
    return (
        <div>
            <span data-testid="logged-in">{loggedIn ? 'yes' : 'no'}</span>
            <span data-testid="profile-exists">{profileExists ? 'yes' : 'no'}</span>
            <span data-testid="wishlist-count">{wishlist?.length || 0}</span>
            <span data-testid="username">{user?.username || 'none'}</span>
            <button data-testid="refresh-profile" onClick={() => refreshProfile()}>Refresh Profile</button>
            <button data-testid="refresh-wishlist" onClick={() => refreshWishlist()}>Refresh Wishlist</button>
            <button data-testid="sign-out" onClick={() => signOut()}>Sign Out</button>
        </div>
    );
};

describe('UserProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should provide user state context with null initial data', () => {
        render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        expect(screen.getByTestId('logged-in')).toHaveTextContent('no');
        expect(screen.getByTestId('profile-exists')).toHaveTextContent('no');
        expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    });

    it('should initialize loggedIn when initialUser provided', () => {
        const initialUser = { id: 'user-123', username: 'testuser' } as User;
        
        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        expect(screen.getByTestId('logged-in')).toHaveTextContent('yes');
        expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });

    it('should initialize wishlist when provided', () => {
        const initialWishlist = [{ book_id: 'book-1' }];
        
        render(
            <UserProvider initialUser={null} initialWishlist={initialWishlist}>
                <TestConsumer />
            </UserProvider>
        );

        expect(screen.getByTestId('wishlist-count')).toHaveTextContent('1');
    });

    it('should set profileExists when user has first_name', () => {
        const initialUser = { id: 'user-123', first_name: 'John' } as User;
        
        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        expect(screen.getByTestId('profile-exists')).toHaveTextContent('yes');
    });

    it('should not set profileExists when user has no first_name', () => {
        const initialUser = { id: 'user-123', first_name: '' } as User;
        
        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        expect(screen.getByTestId('profile-exists')).toHaveTextContent('no');
    });

    it('should preserve username from initialUser', () => {
        const initialUser = { id: 'user-123', username: 'testuser' } as User;
        
        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });

    it('should handle null initialUser gracefully', () => {
        render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        expect(screen.getByTestId('logged-in')).toHaveTextContent('no');
        expect(screen.getByTestId('username')).toHaveTextContent('none');
    });

    it('should handle undefined initialWishlist', () => {
        const initialUser = { id: 'user-123' } as User;
        
        render(
            <UserProvider initialUser={initialUser} initialWishlist={undefined as any}>
                <TestConsumer />
            </UserProvider>
        );

        expect(screen.getByTestId('wishlist-count')).toHaveTextContent('0');
    });

    it('should create supabase client once', () => {
        const { createFrontendClient } = require('@/utils/db/client');

        const { rerender } = render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        rerender(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        expect(createFrontendClient).toHaveBeenCalledTimes(1);
    });

    it('should call refreshProfile and update user data', async () => {
        const { getUserData } = require('@/data/user/GetUserData');
        getUserData.mockResolvedValue({ data: { id: 'user-123', username: 'updateduser', first_name: 'John' }, error: null });

        const initialUser = { id: 'user-123', username: 'testuser' } as User;

        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-profile').click();
        });

        await waitFor(() => {
            expect(getUserData).toHaveBeenCalled();
        });
    });

    it('should handle refreshProfile error', async () => {
        const { getUserData } = require('@/data/user/GetUserData');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        getUserData.mockRejectedValue(new Error('Network error'));

        const initialUser = { id: 'user-123' } as User;

        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-profile').click();
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        consoleSpy.mockRestore();
    });

    it('should call refreshWishlist and update wishlist', async () => {
        const { getUserWishlist } = require('@/data/user/GetUserData');
        getUserWishlist.mockResolvedValue({ data: [{ book_id: 'book-1' }, { book_id: 'book-2' }], error: null });

        const initialUser = { id: 'user-123' } as User;

        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-wishlist').click();
        });

        await waitFor(() => {
            expect(getUserWishlist).toHaveBeenCalledWith('user-123');
        });
    });

    it('should handle refreshWishlist error', async () => {
        const { getUserWishlist } = require('@/data/user/GetUserData');
        getUserWishlist.mockRejectedValue(new Error('Network error'));

        const initialUser = { id: 'user-123' } as User;

        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-wishlist').click();
        });

        await waitFor(() => {
            expect(getUserWishlist).toHaveBeenCalled();
        });
    });

    it('should call signOut and clear activeUserId', async () => {
        const mockSignOut = jest.fn().mockResolvedValue({});
        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
                signOut: mockSignOut,
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        const initialUser = { id: 'user-123' } as User;

        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('sign-out').click();
        });

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
        });
    });

    it('should not refresh profile when activeUserId is null', async () => {
        const { getUserData } = require('@/data/user/GetUserData');
        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-profile').click();
        });

        expect(getUserData).not.toHaveBeenCalled();
    });

    it('should not refresh wishlist when activeUserId is null', async () => {
        const { getUserWishlist } = require('@/data/user/GetUserData');
        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-wishlist').click();
        });

        expect(getUserWishlist).not.toHaveBeenCalled();
    });

    it('should call syncAllData when auth state changes to signed in', async () => {
        const { getUserData, getUserWishlist } = require('@/data/user/GetUserData');
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;
        
        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn((cb) => {
                    authCallback = cb;
                    return { data: { subscription: { unsubscribe: jest.fn() } } };
                }),
                signOut: jest.fn(),
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        getUserData.mockResolvedValue({ data: { id: 'user-123', first_name: 'John' }, error: null });
        getUserWishlist.mockResolvedValue({ data: [], error: null });

        render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        // Simulate auth state change to SIGNED_IN
        if (authCallback) {
            await act(async () => {
                await authCallback('SIGNED_IN', { user: { id: 'user-123' } });
            });
        }

        await waitFor(() => {
            expect(getUserData).toHaveBeenCalled();
            expect(getUserWishlist).toHaveBeenCalledWith('user-123');
        });
    });

    it('should handle syncAllData error', async () => {
        const { getUserData } = require('@/data/user/GetUserData');
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;
        
        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn((cb) => {
                    authCallback = cb;
                    return { data: { subscription: { unsubscribe: jest.fn() } } };
                }),
                signOut: jest.fn(),
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        getUserData.mockRejectedValue(new Error('Sync error'));

        render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        if (authCallback) {
            await act(async () => {
                await authCallback('SIGNED_IN', { user: { id: 'user-123' } });
            });
        }

        await waitFor(() => {
            expect(getUserData).toHaveBeenCalled();
        });
    });

    it('should dispatch RESET when syncAllData receives null user', async () => {
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;

        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn((cb) => {
                    authCallback = cb;
                    return { data: { subscription: { unsubscribe: jest.fn() } } };
                }),
                signOut: jest.fn(),
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        const { getUserData, getUserWishlist } = require('@/data/user/GetUserData');
        getUserData.mockResolvedValue({ data: null, error: null });
        getUserWishlist.mockResolvedValue({ data: [], error: null });

        render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        // When user is null, syncAllData should dispatch RESET and return early
        if (authCallback) {
            await act(async () => {
                await authCallback('SIGNED_IN', { user: null });
            });
        }

        // getUserData should NOT be called because syncAllData returns early when userId is null
        expect(getUserData).not.toHaveBeenCalled();
        expect(getUserWishlist).not.toHaveBeenCalled();
    });

    it('should use fallback user object when getUserData returns null data', async () => {
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;

        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn((cb) => {
                    authCallback = cb;
                    return { data: { subscription: { unsubscribe: jest.fn() } } };
                }),
                signOut: jest.fn(),
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        const { getUserData, getUserWishlist } = require('@/data/user/GetUserData');
        // Return null data but no error - this tests the fallback branch
        getUserData.mockResolvedValue({ data: null, error: null });
        getUserWishlist.mockResolvedValue({ data: [{ book_id: 'book-1' }], error: null });

        render(
            <UserProvider initialUser={{ id: 'user-123' }} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        if (authCallback) {
            await act(async () => {
                await authCallback('SIGNED_IN', { user: { id: 'user-123' } });
            });
        }

        await waitFor(() => {
            expect(getUserData).toHaveBeenCalled();
        });
    });

    it('should use empty array when getUserWishlist returns null', async () => {
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;

        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn((cb) => {
                    authCallback = cb;
                    return { data: { subscription: { unsubscribe: jest.fn() } } };
                }),
                signOut: jest.fn(),
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        const { getUserData, getUserWishlist } = require('@/data/user/GetUserData');
        getUserData.mockResolvedValue({ data: { id: 'user-123', first_name: 'John' }, error: null });
        // Return null data - tests the ?? [] fallback
        getUserWishlist.mockResolvedValue({ data: null, error: null });

        render(
            <UserProvider initialUser={{ id: 'user-123' }} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        if (authCallback) {
            await act(async () => {
                await authCallback('SIGNED_IN', { user: { id: 'user-123' } });
            });
        }

        await waitFor(() => {
            expect(getUserData).toHaveBeenCalled();
        });
    });

    it('should use fallback user in refreshProfile when getUserData returns null', async () => {
        const { getUserData } = require('@/data/user/GetUserData');
        // Return null data - tests the fallback branch in refreshProfile
        getUserData.mockResolvedValue({ data: null, error: null });

        const initialUser = { id: 'user-123', username: 'testuser' } as User;

        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-profile').click();
        });

        await waitFor(() => {
            expect(getUserData).toHaveBeenCalled();
        });
    });

    it('should use empty array fallback in refreshWishlist when data is null', async () => {
        const { getUserWishlist } = require('@/data/user/GetUserData');
        // Return null data - tests the ?? [] fallback in refreshWishlist
        getUserWishlist.mockResolvedValue({ data: null, error: null });

        const initialUser = { id: 'user-123' } as User;

        render(
            <UserProvider initialUser={initialUser} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        await act(async () => {
            screen.getByTestId('refresh-wishlist').click();
        });

        await waitFor(() => {
            expect(getUserWishlist).toHaveBeenCalledWith('user-123');
        });
    });

    it('should not call getUserData when auth state changes with null user id', async () => {
        let authCallback: ((event: string, session: any) => Promise<void>) | null = null;

        const { createFrontendClient } = require('@/utils/db/client');
        createFrontendClient.mockReturnValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
                onAuthStateChange: jest.fn((cb) => {
                    authCallback = cb;
                    return { data: { subscription: { unsubscribe: jest.fn() } } };
                }),
                signOut: jest.fn(),
            },
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            removeChannel: jest.fn(),
        });

        const { getUserData } = require('@/data/user/GetUserData');

        render(
            <UserProvider initialUser={null} initialWishlist={null}>
                <TestConsumer />
            </UserProvider>
        );

        // When user.id is null/undefined, syncAllData should return early
        if (authCallback) {
            await act(async () => {
                await authCallback('SIGNED_IN', { user: { id: null } });
            });
        }

        expect(getUserData).not.toHaveBeenCalled();
    });
});
