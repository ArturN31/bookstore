import { render, screen, act } from '@testing-library/react';
import { useContext } from 'react';
import { UserProvider } from '@/providers/user/UserProvider';
import { UserStateContext, UserActionsContext } from '@/providers/user/UserContext';
import { getUserData, getUserWishlist } from '@/data/user/GetUserData';
import { createFrontendClient } from '@/utils/db/client';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { useUserListeners } from '@/providers/user/utils/useUserListeners';

type SyncAllDataFn = (supabaseUser: SupabaseUser | null) => Promise<void>;
type ResetFn = () => void;

const mockedRouter = { push: jest.fn(), refresh: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: jest.fn(() => mockedRouter) }));
jest.mock('@/utils/db/client', () => ({ createFrontendClient: jest.fn() }));
jest.mock('@/data/user/GetUserData', () => ({
    getUserData: jest.fn(),
    getUserWishlist: jest.fn(),
}));
jest.mock('@/providers/user/utils/useUserListeners', () => ({ useUserListeners: jest.fn() }));

const mockSupabase = {
    auth: { signOut: jest.fn().mockResolvedValue({ error: null }) },
} as unknown as SupabaseClient;

(createFrontendClient as jest.Mock).mockReturnValue(mockSupabase);

const TestConsumer = () => {
    const state = useContext(UserStateContext);
    const actions = useContext(UserActionsContext);
    if (!state || !actions) return null;
    return (
        <div>
            <span data-testid="user-id">{state.user?.id || 'none'}</span>
            <span data-testid="error">{state.error || 'none'}</span>
            <button
                onClick={actions.refreshProfile}
                data-testid="btn-refresh"
            >
                Refresh
            </button>
            <button
                onClick={actions.refreshWishlist}
                data-testid="btn-refresh-wishlist"
            >
                Refresh Wishlist
            </button>
            <button
                onClick={actions.signOut}
                data-testid="btn-signout"
            >
                Sign Out
            </button>
        </div>
    );
};

describe('UserProvider Coverage', () => {
    let capturedSyncAllData: SyncAllDataFn;
    let capturedReset: ResetFn;
    const mockedGetUserData = getUserData as jest.Mock;
    const mockedGetUserWishlist = getUserWishlist as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        (useUserListeners as jest.Mock).mockImplementation(
            (params: { syncAllData: SyncAllDataFn; reset: ResetFn }) => {
                capturedSyncAllData = params.syncAllData;
                capturedReset = params.reset;
            },
        );
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as jest.Mock).mockRestore();
    });

    it('should catch error when refreshWishlist returns an error', async () => {
        mockedGetUserWishlist.mockResolvedValue({ data: null, error: 'DB Error' });

        render(
            <UserProvider
                initialUser={{ id: 'u1' } as User}
                initialWishlist={[]}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-refresh-wishlist').click();
        });

        expect(screen.getByTestId('error')).toHaveTextContent('Wishlist update failed');
        expect(console.error).toHaveBeenCalled();
    });

    it('should construct fallback payload when userData is null', async () => {
        mockedGetUserData.mockResolvedValue({ data: null, error: null });
        mockedGetUserWishlist.mockResolvedValue({ data: [], error: null });
        render(
            <UserProvider
                initialUser={null}
                initialWishlist={null}
            >
                <TestConsumer />
            </UserProvider>,
        );
        await act(async () => {
            await capturedSyncAllData({ id: 'fallback-u1' } as SupabaseUser);
        });
        expect(screen.getByTestId('user-id')).toHaveTextContent('fallback-u1');
    });

    it('should set error on refreshProfile API error', async () => {
        mockedGetUserData.mockResolvedValue({ data: null, error: 'DB Error' });
        render(
            <UserProvider
                initialUser={{ id: 'u1' } as User}
                initialWishlist={[]}
            >
                <TestConsumer />
            </UserProvider>,
        );
        await act(async () => {
            screen.getByTestId('btn-refresh').click();
        });
        expect(screen.getByTestId('error')).toHaveTextContent('Profile update failed');
    });

    it('should reset state when syncAllData is called with null', async () => {
        render(
            <UserProvider
                initialUser={null}
                initialWishlist={null}
            >
                <TestConsumer />
            </UserProvider>,
        );
        await act(async () => {
            await capturedSyncAllData(null);
        });
        expect(screen.getByTestId('user-id')).toHaveTextContent('none');
    });

    it('should perform full signOut flow', async () => {
        render(
            <UserProvider
                initialUser={{ id: 'u1' } as User}
                initialWishlist={[]}
            >
                <TestConsumer />
            </UserProvider>,
        );
        await act(async () => {
            screen.getByTestId('btn-signout').click();
        });
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(mockedRouter.push).toHaveBeenCalledWith('/');
    });

    it('should set error when wishlistData.error is truthy', async () => {
        mockedGetUserData.mockResolvedValue({ data: { id: 'u1' }, error: null });
        mockedGetUserWishlist.mockResolvedValue({ data: null, error: 'Wishlist Error' });

        render(
            <UserProvider
                initialUser={null}
                initialWishlist={null}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            await capturedSyncAllData({ id: 'u1' } as SupabaseUser);
        });

        expect(screen.getByTestId('error')).toHaveTextContent('Wishlist Error');
    });

    it('should set wishlist to [] when wishlistData.data is null', async () => {
        mockedGetUserData.mockResolvedValue({ data: { id: 'u1' }, error: null });
        mockedGetUserWishlist.mockResolvedValue({ data: null, error: null });

        render(
            <UserProvider
                initialUser={null}
                initialWishlist={null}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            await capturedSyncAllData({ id: 'u1' } as SupabaseUser);
        });

        expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('should format error message for non-Error object', async () => {
        mockedGetUserData.mockRejectedValue('String Error');

        render(
            <UserProvider
                initialUser={null}
                initialWishlist={null}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            await capturedSyncAllData({ id: 'u1' } as SupabaseUser);
        });

        expect(screen.getByTestId('error')).toHaveTextContent('An unexpected error occurred');
    });

    it('should use fallback user object when data is null in refreshProfile', async () => {
        mockedGetUserData.mockResolvedValue({ data: null, error: null });

        render(
            <UserProvider
                initialUser={{ id: 'u1' } as User}
                initialWishlist={[]}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-refresh').click();
        });

        expect(mockedGetUserData).toHaveBeenCalled();
    });

    it('should return early when activeUserId is null', async () => {
        render(
            <UserProvider
                initialUser={null}
                initialWishlist={null}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-refresh').click();
            screen.getByTestId('btn-refresh-wishlist').click();
        });

        expect(mockedGetUserData).not.toHaveBeenCalled();
        expect(mockedGetUserWishlist).not.toHaveBeenCalled();
    });

    it('should default to empty array when data is null in refreshWishlist', async () => {
        mockedGetUserWishlist.mockResolvedValue({ data: null, error: null });

        render(
            <UserProvider
                initialUser={{ id: 'u1' } as User}
                initialWishlist={[]}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-refresh-wishlist').click();
        });

        expect(mockedGetUserWishlist).toHaveBeenCalled();
    });

    it('should hit the Error instance branch in syncAllData', async () => {
        const error = new Error('Test Error Message');
        mockedGetUserData.mockRejectedValue(error);

        render(
            <UserProvider
                initialUser={null}
                initialWishlist={null}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            await capturedSyncAllData({ id: 'u1' } as SupabaseUser);
        });

        expect(screen.getByTestId('error')).toHaveTextContent('Test Error Message');
    });

    it('should execute the reset function passed to useUserListeners', async () => {
        render(
            <UserProvider
                initialUser={null}
                initialWishlist={null}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            capturedReset();
        });

        expect(screen.getByTestId('user-id')).toHaveTextContent('none');
    });

    it('should NOT update state if activeUserId changes during an async refreshProfile call', async () => {
        let resolvePromise: (value: { data: any; error: string | null }) => void;
        const pendingPromise = new Promise<{ data: any; error: string | null }>((resolve) => {
            resolvePromise = resolve;
        });
        mockedGetUserData.mockReturnValue(pendingPromise);

        render(
            <UserProvider
                initialUser={{ id: 'u1', name: 'Original' } as any}
                initialWishlist={[]}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-refresh').click();
        });

        await act(async () => {
            screen.getByTestId('btn-signout').click();
        });

        await act(async () => {
            resolvePromise({ data: { id: 'u1', name: 'Stale Data' }, error: null });
        });

        expect(screen.getByTestId('user-id')).toHaveTextContent('none');
    });

    it('should trigger RESET immediately when syncAllData is called with null', async () => {
        render(
            <UserProvider
                initialUser={{ id: 'u1' } as any}
                initialWishlist={[]}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            await capturedSyncAllData(null);
        });

        expect(screen.getByTestId('user-id')).toHaveTextContent('none');
        expect(mockedGetUserData).not.toHaveBeenCalled();
    });

    it('should clear error state upon a successful subsequent refresh', async () => {
        mockedGetUserData.mockResolvedValue({ data: null, error: 'Initial DB Error' });

        const { rerender } = render(
            <UserProvider
                initialUser={{ id: 'u1' } as any}
                initialWishlist={[]}
            >
                <TestConsumer />
            </UserProvider>,
        );

        await act(async () => {
            screen.getByTestId('btn-refresh').click();
        });
        expect(screen.getByTestId('error')).toHaveTextContent('Profile update failed');

        mockedGetUserData.mockResolvedValue({ data: { id: 'u1' }, error: null });

        await act(async () => {
            screen.getByTestId('btn-refresh').click();
        });

        expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
});
