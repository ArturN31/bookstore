import { renderHook, act } from '@testing-library/react';
import { useUserState } from '@/providers/user/utils/useUser';
import { updateWishlistVisibilityAction } from '@/data/user/wishlist/sharing/WishlistShareAction';
import { enqueueSnackbar } from 'notistack';
import {
    UserRecord,
    useWishlistSharing,
} from '@/app/user/wishlist/components/WishlistSharing/hook/useWishlistSharing';

jest.mock('@/providers/user/utils/useUser');
jest.mock('@/data/user/wishlist/sharing/WishlistShareAction');
jest.mock('notistack', () => ({
    enqueueSnackbar: jest.fn(),
}));

describe('useWishlistSharing', () => {
    const mockUseUserState = useUserState as jest.MockedFunction<typeof useUserState>;
    const mockUpdateWishlistVisibilityAction =
        updateWishlistVisibilityAction as jest.MockedFunction<
            typeof updateWishlistVisibilityAction
        >;
    const mockEnqueueSnackbar = enqueueSnackbar as jest.MockedFunction<typeof enqueueSnackbar>;

    const defaultUser: UserRecord = {
        id: 'user-123',
        username: 'testuser',
        is_wishlist_public: false,
        wishlist_share_token: 'token-456',
    };

    beforeAll(() => {
        Object.defineProperty(globalThis, 'crypto', {
            value: {
                randomUUID: () => 'mock-uuid-789',
            },
        });

        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockResolvedValue(undefined),
            },
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseUserState.mockReturnValue({
            user: defaultUser,
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: true,
            wishlist: [],
            loggedIn: true,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);
    });

    it('should initialize with values from user state', () => {
        const { result } = renderHook(() => useWishlistSharing());

        expect(result.current.username).toBe('testuser');
        expect(result.current.isPublic).toBe(false);
        expect(result.current.shareToken).toBe('token-456');
        expect(result.current.open).toBe(false);
        expect(result.current.activeShareUrl).toContain('/user/wishlist/shared/token/token-456');
    });

    it('should return correct activeShareUrl when wishlist is public', () => {
        mockUseUserState.mockReturnValue({
            user: {
                ...defaultUser,
                is_wishlist_public: true,
            },
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: true,
            wishlist: [],
            loggedIn: true,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);

        const { result } = renderHook(() => useWishlistSharing());
        expect(result.current.activeShareUrl).toContain('/user/wishlist/shared/testuser');
    });

    it('should return correct activeShareUrl when wishlist is private and has token', () => {
        mockUseUserState.mockReturnValue({
            user: {
                ...defaultUser,
                is_wishlist_public: false,
                wishlist_share_token: 'token-456',
            },
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: true,
            wishlist: [],
            loggedIn: true,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);

        const { result } = renderHook(() => useWishlistSharing());
        expect(result.current.activeShareUrl).toContain('/user/wishlist/shared/token/token-456');
    });

    it('should handle missing user state gracefully', () => {
        mockUseUserState.mockReturnValue({
            user: null,
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: false,
            wishlist: [],
            loggedIn: false,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);

        const { result } = renderHook(() => useWishlistSharing());

        expect(result.current.username).toBe('');
        expect(result.current.isPublic).toBe(false);
        expect(result.current.shareToken).toBe('');
        expect(result.current.activeShareUrl).toBe('');
    });

    it('should open and close the dialog', () => {
        const { result } = renderHook(() => useWishlistSharing());

        act(() => {
            result.current.setOpen(true);
        });
        expect(result.current.open).toBe(true);

        act(() => {
            result.current.setOpen(false);
        });
        expect(result.current.open).toBe(false);
    });

    it('should toggle visibility to public successfully', async () => {
        mockUpdateWishlistVisibilityAction.mockResolvedValue({ error: null });
        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleTogglePublic({
                target: { checked: true },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.isPublic).toBe(true);
        expect(result.current.shareToken).toBe('token-456');
        expect(mockUpdateWishlistVisibilityAction).toHaveBeenCalledWith(
            'user-123',
            true,
            undefined,
        );
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Wishlist is now public', {
            variant: 'success',
        });
    });

    it('should toggle visibility to private and generate token if shareToken is missing', async () => {
        mockUseUserState.mockReturnValue({
            user: {
                ...defaultUser,
                is_wishlist_public: true,
                wishlist_share_token: null,
            },
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: true,
            wishlist: [],
            loggedIn: true,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);

        mockUpdateWishlistVisibilityAction.mockResolvedValue({ error: null });
        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleTogglePublic({
                target: { checked: false },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.isPublic).toBe(false);
        expect(result.current.shareToken).toBe('mock-uuid-789');
        expect(mockUpdateWishlistVisibilityAction).toHaveBeenCalledWith(
            'user-123',
            false,
            'mock-uuid-789',
        );
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Wishlist is now private', {
            variant: 'success',
        });
    });

    it('should handle missing user id when toggling visibility', async () => {
        mockUseUserState.mockReturnValue({
            user: { ...defaultUser, id: undefined },
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: true,
            wishlist: [],
            loggedIn: true,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);

        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleTogglePublic({
                target: { checked: true },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('User identifier missing', {
            variant: 'error',
        });
    });

    it('should handle non-Error thrown when toggling visibility', async () => {
        mockUpdateWishlistVisibilityAction.mockRejectedValue('String error');
        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleTogglePublic({
                target: { checked: true },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('String error', {
            variant: 'error',
        });
    });

    it('should handle toggle visibility error gracefully', async () => {
        mockUpdateWishlistVisibilityAction.mockResolvedValue({ error: 'Server error' });
        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleTogglePublic({
                target: { checked: true },
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Server error', { variant: 'error' });
        expect(result.current.isPublic).toBe(false);
    });

    it('should generate or reset token successfully', async () => {
        mockUpdateWishlistVisibilityAction.mockResolvedValue({ error: null });
        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleGenerateOrResetToken();
        });

        expect(result.current.shareToken).toBe('mock-uuid-789');
        expect(mockUpdateWishlistVisibilityAction).toHaveBeenCalledWith(
            'user-123',
            false,
            'mock-uuid-789',
        );
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Private share link updated successfully',
            {
                variant: 'success',
            },
        );
    });

    it('should handle missing user id when generating or resetting token', async () => {
        mockUseUserState.mockReturnValue({
            user: { ...defaultUser, id: undefined },
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: true,
            wishlist: [],
            loggedIn: true,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);

        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleGenerateOrResetToken();
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('User identifier missing', {
            variant: 'error',
        });
    });

    it('should handle result.error when generating or resetting token', async () => {
        mockUpdateWishlistVisibilityAction.mockResolvedValue({ error: 'Action error' });
        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleGenerateOrResetToken();
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Action error', {
            variant: 'error',
        });
    });

    it('should handle non-Error thrown when generating or resetting token', async () => {
        mockUpdateWishlistVisibilityAction.mockRejectedValue('Token gen string error');
        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleGenerateOrResetToken();
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Token gen string error', {
            variant: 'error',
        });
    });

    it('should handle generate or reset token error', async () => {
        mockUpdateWishlistVisibilityAction.mockRejectedValue(new Error('Network failure'));
        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            result.current.handleGenerateOrResetToken();
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Network failure', { variant: 'error' });
    });

    it('should return empty activeShareUrl if not public and no shareToken', () => {
        mockUseUserState.mockReturnValue({
            user: {
                ...defaultUser,
                is_wishlist_public: false,
                wishlist_share_token: null,
            },
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: true,
            wishlist: [],
            loggedIn: true,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);

        const { result } = renderHook(() => useWishlistSharing());
        expect(result.current.activeShareUrl).toBe('');
    });

    it('should return early when copying share link if activeShareUrl is empty', async () => {
        mockUseUserState.mockReturnValue({
            user: {
                ...defaultUser,
                is_wishlist_public: false,
                wishlist_share_token: null,
            },
            isLoading: false,
            error: null,
            refreshUser: async () => {},
            profileExists: true,
            wishlist: [],
            loggedIn: true,
            loading: false,
        } as unknown as ReturnType<typeof useUserState>);

        const { result } = renderHook(() => useWishlistSharing());
        expect(result.current.activeShareUrl).toBe('');

        await act(async () => {
            await result.current.handleCopyShareLink();
        });

        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('should copy link to clipboard successfully', async () => {
        const writeTextMock = navigator.clipboard.writeText as unknown as jest.MockedFunction<
            (text: string) => Promise<void>
        >;
        writeTextMock.mockResolvedValue(undefined);
        jest.useFakeTimers();

        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            await result.current.handleCopyShareLink();
        });

        expect(writeTextMock).toHaveBeenCalledWith(result.current.activeShareUrl);
        expect(result.current.copied).toBe(true);
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Link copied to clipboard!', {
            variant: 'success',
        });

        act(() => {
            jest.runAllTimers();
        });

        expect(result.current.copied).toBe(false);
        jest.useRealTimers();
    });

    it('should handle clipboard copy non-Error failure', async () => {
        const writeTextMock = navigator.clipboard.writeText as unknown as jest.MockedFunction<
            (text: string) => Promise<void>
        >;
        writeTextMock.mockRejectedValue('Deny string');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            await result.current.handleCopyShareLink();
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Failed to copy link.', {
            variant: 'error',
        });
        expect(consoleSpy).toHaveBeenCalledWith(
            '[useWishlistSharing] Clipboard failure:',
            'Deny string',
        );

        consoleSpy.mockRestore();
    });

    it('should handle clipboard copy error', async () => {
        const writeTextMock = navigator.clipboard.writeText as unknown as jest.MockedFunction<
            (text: string) => Promise<void>
        >;
        writeTextMock.mockRejectedValue(new Error('Copy denied'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useWishlistSharing());

        await act(async () => {
            await result.current.handleCopyShareLink();
        });

        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Failed to copy link.', {
            variant: 'error',
        });
        expect(consoleSpy).toHaveBeenCalledWith(
            '[useWishlistSharing] Clipboard failure:',
            'Copy denied',
        );

        consoleSpy.mockRestore();
    });
});
