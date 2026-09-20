import { renderHook, act } from '@testing-library/react';
import {
    updatePrivacySettingsAction,
    regenerateWishlistShareTokenAction,
} from '@/data/user/profile/PrivacySettingsAction';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';
import { UserPrivacySettingsDto } from '@/data/user/profile/PrivacySettingsService';
import { usePrivacySettingsModal } from '@/app/user/profile/public/[username]/components/Settings/PrivacySettingsModal/usePrivacySettingsModal';

jest.mock('@/data/user/profile/PrivacySettingsAction', () => ({
    updatePrivacySettingsAction: jest.fn(),
    regenerateWishlistShareTokenAction: jest.fn(),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn(),
}));

describe('usePrivacySettingsModal', () => {
    const mockUpdatePrivacySettingsAction = updatePrivacySettingsAction as jest.MockedFunction<
        typeof updatePrivacySettingsAction
    >;
    const mockRegenerateWishlistShareTokenAction =
        regenerateWishlistShareTokenAction as jest.MockedFunction<
            typeof regenerateWishlistShareTokenAction
        >;
    const mockSanitizeSupabaseError = sanitizeSupabaseError as jest.MockedFunction<
        typeof sanitizeSupabaseError
    >;

    const mockUserId = 'user-123';
    const mockOnClose = jest.fn();
    const mockInitialSettings: UserPrivacySettingsDto = {
        is_profile_public: true,
        is_wishlist_public: false,
        are_reviews_public: true,
        wishlist_share_token: 'token-123',
    };

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        userId: mockUserId,
        initialSettings: mockInitialSettings,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        document.body.style.overflow = '';
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('initializes hook state correctly', () => {
        const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

        expect(result.current.settings).toEqual(mockInitialSettings);
        expect(result.current.isPending).toBe(false);
        expect(result.current.errorMessage).toBeNull();
        expect(result.current.copied).toBe(false);
        expect(result.current.shareUrl).toBe(
            `${window.location.origin}/user/wishlist/shared?token=token-123`,
        );
    });

    it('updates internal settings when initialSettings prop changes', () => {
        const { result, rerender } = renderHook((props) => usePrivacySettingsModal(props), {
            initialProps: defaultProps,
        });

        const updatedInitialSettings: UserPrivacySettingsDto = {
            ...mockInitialSettings,
            is_profile_public: false,
        };

        rerender({
            ...defaultProps,
            initialSettings: updatedInitialSettings,
        });

        expect(result.current.settings).toEqual(updatedInitialSettings);
    });

    describe('Body overflow and keydown listeners', () => {
        it('locks body overflow to hidden when modal is open and restores original overflow on unmount', () => {
            document.body.style.overflow = 'auto';

            const { unmount } = renderHook(() => usePrivacySettingsModal(defaultProps));

            expect(document.body.style.overflow).toBe('hidden');

            unmount();

            expect(document.body.style.overflow).toBe('auto');
        });

        it('does not alter body overflow if isOpen is false', () => {
            document.body.style.overflow = 'scroll';

            renderHook(() =>
                usePrivacySettingsModal({
                    ...defaultProps,
                    isOpen: false,
                }),
            );

            expect(document.body.style.overflow).toBe('scroll');
        });

        it('calls onClose when Escape key is pressed and isPending is false', () => {
            renderHook(() => usePrivacySettingsModal(defaultProps));

            act(() => {
                document.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
                );
            });

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('does not call onClose when Escape key is pressed if isPending is true', async () => {
            let resolveAction!: (
                value: Awaited<ReturnType<typeof updatePrivacySettingsAction>>,
            ) => void;

            mockUpdatePrivacySettingsAction.mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolveAction = resolve;
                    }),
            );

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            act(() => {
                result.current.handleToggle('is_profile_public');
            });

            expect(result.current.isPending).toBe(true);

            act(() => {
                document.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
                );
            });

            expect(mockOnClose).not.toHaveBeenCalled();

            await act(async () => {
                resolveAction({ success: true, data: null, error: undefined });
            });
        });
    });

    describe('handleToggle', () => {
        it('updates settings state on successful server action', async () => {
            mockUpdatePrivacySettingsAction.mockResolvedValueOnce({
                success: true,
                data: null,
                error: undefined,
            });

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                result.current.handleToggle('is_profile_public');
            });

            expect(mockUpdatePrivacySettingsAction).toHaveBeenCalledWith(mockUserId, {
                is_profile_public: false,
                is_wishlist_public: false,
                are_reviews_public: true,
            });
            expect(result.current.settings.is_profile_public).toBe(false);
            expect(result.current.errorMessage).toBeNull();
        });

        it('sets sanitized error message when server action fails', async () => {
            const rawError = 'Database write failed';
            mockUpdatePrivacySettingsAction.mockResolvedValueOnce({
                success: false,
                data: null,
                error: rawError,
            });
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized DB error');

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                result.current.handleToggle('is_profile_public');
            });

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(rawError, mockUserId);
            expect(result.current.errorMessage).toBe('Sanitized DB error');
        });

        it('catches throw exceptions during action and sets error message', async () => {
            const thrownError = new Error('Network error');
            mockUpdatePrivacySettingsAction.mockRejectedValueOnce(thrownError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Network Error');

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                result.current.handleToggle('is_profile_public');
            });

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(thrownError, mockUserId);
            expect(result.current.errorMessage).toBe('Sanitized Network Error');
        });
    });

    describe('handleRegenerateToken', () => {
        it('updates settings with new token on successful action', async () => {
            mockRegenerateWishlistShareTokenAction.mockResolvedValueOnce({
                success: true,
                data: { token: 'new-generated-token' },
                error: undefined,
            });

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                result.current.handleRegenerateToken();
            });

            expect(mockRegenerateWishlistShareTokenAction).toHaveBeenCalledWith(mockUserId);
            expect(result.current.settings.wishlist_share_token).toBe('new-generated-token');
            expect(result.current.settings.is_wishlist_public).toBe(false);
        });

        it('sets error message when regenerate action returns error', async () => {
            const rawError = 'Unauthorized';
            mockRegenerateWishlistShareTokenAction.mockResolvedValueOnce({
                success: false,
                data: undefined,
                error: rawError,
            });
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Auth Error');

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                result.current.handleRegenerateToken();
            });

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(rawError, mockUserId);
            expect(result.current.errorMessage).toBe('Sanitized Auth Error');
        });

        it('catches exception thrown by regenerate action', async () => {
            const thrownError = new Error('Server Exception');
            mockRegenerateWishlistShareTokenAction.mockRejectedValueOnce(thrownError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Server Error');

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                result.current.handleRegenerateToken();
            });

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(thrownError, mockUserId);
            expect(result.current.errorMessage).toBe('Sanitized Server Error');
        });
    });

    describe('handleCopyTokenLink', () => {
        beforeEach(() => {
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: jest.fn(),
                },
                writable: true,
                configurable: true,
            });
        });

        it('copies shareUrl to clipboard and toggles copied state for 2 seconds', async () => {
            jest.useFakeTimers();
            (navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined);

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                await result.current.handleCopyTokenLink();
            });

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(result.current.shareUrl);
            expect(result.current.copied).toBe(true);

            act(() => {
                jest.advanceTimersByTime(2000);
            });

            expect(result.current.copied).toBe(false);
        });

        it('clears existing copy timer if copy is invoked again quickly', async () => {
            jest.useFakeTimers();
            const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
            (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                await result.current.handleCopyTokenLink();
            });

            await act(async () => {
                await result.current.handleCopyTokenLink();
            });

            expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it('does nothing if shareUrl is empty', async () => {
            const emptyTokenSettings: UserPrivacySettingsDto = {
                ...mockInitialSettings,
                wishlist_share_token: null,
            };

            const { result } = renderHook(() =>
                usePrivacySettingsModal({
                    ...defaultProps,
                    initialSettings: emptyTokenSettings,
                }),
            );

            await act(async () => {
                await result.current.handleCopyTokenLink();
            });

            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        });

        it('sets error message when clipboard write fails', async () => {
            const clipboardError = new Error('Clipboard denied');
            (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(clipboardError);
            mockSanitizeSupabaseError.mockReturnValueOnce('Sanitized Clipboard Error');

            const { result } = renderHook(() => usePrivacySettingsModal(defaultProps));

            await act(async () => {
                await result.current.handleCopyTokenLink();
            });

            expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(clipboardError, mockUserId);
            expect(result.current.errorMessage).toBe('Sanitized Clipboard Error');
        });
    });
});
