import { render, screen, waitFor } from '@testing-library/react';
import {
    getServerConsentCookie,
    SessionProviderWrapper,
} from '@/components/layout/SessionProviderWrapper';
import { createBackendClient } from '@/utils/db/server';
import { getUserData, getUserWishlist } from '@/data/user/UserService';
import { getCartData } from '@/data/cart/CartService';
import { saveUserConsentToSupabase } from '@/data/consentCookies/ConsentAction';
import { cookies } from 'next/headers';
import { CONSENT_VERSION } from '@/providers/ConsentProvider';

interface ProvidersProps {
    children: React.ReactNode;
    initialSessionData: Record<string, unknown>;
}

jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}));
jest.mock('@/utils/db/server', () => ({ createBackendClient: jest.fn() }));
jest.mock('@/data/user/UserService', () => ({
    getUserData: jest.fn(),
    getUserWishlist: jest.fn(),
}));
jest.mock('@/data/cart/CartService', () => ({ getCartData: jest.fn() }));
jest.mock('@/data/consentCookies/ConsentAction', () => ({
    saveUserConsentToSupabase: jest.fn(),
}));
// Do not mock getServerConsentCookie here so we can test its real implementation branches!
jest.mock('@/providers/user/utils/UserMapper', () => ({ mapUserData: jest.fn((d: unknown) => d) }));
jest.mock('@/providers/cart/utils/CartMapper', () => ({ mapCartData: jest.fn((d: unknown) => d) }));

jest.mock('@/providers/Providers', () => ({
    Providers: ({ children, initialSessionData }: ProvidersProps) => (
        <div
            data-testid="providers-root"
            data-session={JSON.stringify(initialSessionData)}
        >
            {children}
        </div>
    ),
}));

describe('SessionProviderWrapper & getServerConsentCookie', () => {
    const mockCreateClient = createBackendClient as jest.Mock;
    const mockSaveUserConsentToSupabase = saveUserConsentToSupabase as jest.Mock;

    beforeEach(() => jest.clearAllMocks());

    const getSessionData = () => {
        const element = screen.getByTestId('providers-root');
        return JSON.parse(element.getAttribute('data-session') || '{}');
    };

    describe('getServerConsentCookie branches', () => {
        it('returns null when consentCookie or its value is missing', async () => {
            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(undefined),
            });

            const result = await getServerConsentCookie();
            expect(result).toBeNull();
        });

        it('returns null when parsed version does not match CONSENT_VERSION', async () => {
            const invalidVersionState = {
                necessary: true,
                analytics: true,
                version: 'INVALID_VERSION',
                timestamp: '2026-01-01',
            };
            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: JSON.stringify(invalidVersionState) }),
            });

            const result = await getServerConsentCookie();
            expect(result).toBeNull();
        });

        it('returns null when JSON parsing throws an error', async () => {
            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: 'malformed-json{' }),
            });

            const result = await getServerConsentCookie();
            expect(result).toBeNull();
        });

        it('returns null when cookies() throws an exception', async () => {
            (cookies as unknown as jest.Mock).mockRejectedValue(new Error('Cookies error'));

            const result = await getServerConsentCookie();
            expect(result).toBeNull();
        });

        it('returns parsed consent state when valid', async () => {
            const validState = {
                necessary: true,
                analytics: true,
                version: CONSENT_VERSION,
                timestamp: '2026-01-01',
            };
            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: JSON.stringify(validState) }),
            });

            const result = await getServerConsentCookie();
            expect(result).toEqual(validState);
        });
    });

    describe('SessionProviderWrapper', () => {
        it('covers the "user exists but no cart/wishlist" branches', async () => {
            const mockUser = { id: 'user-123' };
            mockCreateClient.mockResolvedValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                },
            });

            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(undefined),
            });
            (getUserData as jest.Mock).mockResolvedValue({ data: null, error: null });
            (getUserWishlist as jest.Mock).mockResolvedValue({ data: null, error: null });
            (getCartData as jest.Mock).mockResolvedValue({ books: null, error: 'Failed' });

            const component = await SessionProviderWrapper({ children: <div /> });
            render(component);

            await waitFor(() => {
                const data = getSessionData();
                expect(data.initialUser.id).toBe('user-123');
                expect(data.initialWishlist).toEqual([]);
                expect(data.initialCart).toBeNull();
            });
        });

        it('covers the "user exists with full data" branches', async () => {
            const mockUser = { id: 'user-456' };
            mockCreateClient.mockResolvedValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                },
            });

            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(undefined),
            });
            (getUserData as jest.Mock).mockResolvedValue({
                data: { id: 'user-456', first_name: 'John' },
                error: null,
            });
            (getUserWishlist as jest.Mock).mockResolvedValue({ data: [{ id: 1 }], error: null });
            (getCartData as jest.Mock).mockResolvedValue({
                data: { books: [{ id: 'b1' }] },
                error: null,
            });

            const component = await SessionProviderWrapper({ children: <div /> });
            render(component);

            await waitFor(() => {
                const data = getSessionData();
                expect(data.initialUser.first_name).toBe('John');
                expect(data.initialWishlist.length).toBe(1);
                expect(data.initialCart).not.toBeNull();
            });
        });

        it('should sync initialConsent to Supabase when user is authenticated and initialConsent exists', async () => {
            const mockUser = { id: 'user-789' };
            mockCreateClient.mockResolvedValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                },
            });

            const mockConsent = {
                necessary: true,
                analytics: true,
                version: CONSENT_VERSION,
                timestamp: '2026-01-01',
            };

            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: JSON.stringify(mockConsent) }),
            });

            mockSaveUserConsentToSupabase.mockResolvedValue(undefined);

            (getUserData as jest.Mock).mockResolvedValue({ data: null, error: null });
            (getUserWishlist as jest.Mock).mockResolvedValue({ data: null, error: null });
            (getCartData as jest.Mock).mockResolvedValue({ data: null, error: null });

            const component = await SessionProviderWrapper({ children: <div /> });
            render(component);

            await waitFor(() => {
                expect(mockSaveUserConsentToSupabase).toHaveBeenCalledWith(true, CONSENT_VERSION);
            });
        });

        it('should catch and ignore errors when saving initialConsent to Supabase fails', async () => {
            const mockUser = { id: 'user-999' };
            mockCreateClient.mockResolvedValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                },
            });

            const mockConsent = {
                necessary: true,
                analytics: false,
                version: CONSENT_VERSION,
                timestamp: '2026-01-01',
            };

            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue({ value: JSON.stringify(mockConsent) }),
            });

            mockSaveUserConsentToSupabase.mockRejectedValue(new Error('Supabase sync error'));

            (getUserData as jest.Mock).mockResolvedValue({ data: null, error: null });
            (getUserWishlist as jest.Mock).mockResolvedValue({ data: null, error: null });
            (getCartData as jest.Mock).mockResolvedValue({ data: null, error: null });

            const component = await SessionProviderWrapper({ children: <div /> });
            render(component);

            await waitFor(() => {
                expect(mockSaveUserConsentToSupabase).toHaveBeenCalledWith(false, CONSENT_VERSION);
                const data = getSessionData();
                expect(data.initialUser.id).toBe('user-999');
            });
        });

        it('should handle the guest branch and provide "guest" as the key', async () => {
            mockCreateClient.mockResolvedValue({
                auth: {
                    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
                },
            });

            (cookies as unknown as jest.Mock).mockResolvedValue({
                get: jest.fn().mockReturnValue(undefined),
            });

            const component = await SessionProviderWrapper({
                children: <div data-testid="guest-content">Guest View</div>,
            });

            render(component);

            await waitFor(() => {
                const data = getSessionData();

                expect(data.initialUser).toBeNull();
                expect(data.initialWishlist).toEqual([]);
                expect(data.initialCart).toBeNull();
                expect(screen.getByTestId('guest-content')).toBeInTheDocument();
            });
        });
    });
});
