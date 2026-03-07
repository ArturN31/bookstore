import { render, screen, waitFor } from '@testing-library/react';
import { SessionProviderWrapper } from '@/components/layout/SessionProviderWrapper';
import { createBackendClient } from '@/utils/db/server';
import { getUserData, getUserWishlist } from '@/data/user/GetUserData';
import { getCartData } from '@/data/cart/GetCartData';

jest.mock('@/utils/db/server', () => ({ createBackendClient: jest.fn() }));
jest.mock('@/data/user/GetUserData', () => ({
    getUserData: jest.fn(),
    getUserWishlist: jest.fn(),
}));
jest.mock('@/data/cart/GetCartData', () => ({ getCartData: jest.fn() }));
jest.mock('@/providers/user/utils/UserMapper', () => ({ mapUserData: jest.fn((d) => d) }));
jest.mock('@/providers/cart/utils/CartMapper', () => ({ mapCartData: jest.fn((d) => d) }));

jest.mock('@/providers/Providers', () => ({
    Providers: ({ children, initialSessionData }: any) => (
        <div
            data-testid="providers-root"
            data-session={JSON.stringify(initialSessionData)}
        >
            {children}
        </div>
    ),
}));

describe('SessionProviderWrapper Coverage Fix', () => {
    const mockCreateClient = createBackendClient as jest.Mock;

    beforeEach(() => jest.clearAllMocks());

    const getSessionData = () => {
        const element = screen.getByTestId('providers-root');
        return JSON.parse(element.getAttribute('data-session') || '{}');
    };

    it('covers the "user exists but no cart/wishlist" branches', async () => {
        const mockUser = { id: 'user-123' };
        mockCreateClient.mockResolvedValue({
            auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
        });

        (getUserData as jest.Mock).mockResolvedValue(null);
        (getUserWishlist as jest.Mock).mockResolvedValue(null);
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
            auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
        });

        (getUserData as jest.Mock).mockResolvedValue({ id: 'user-456', first_name: 'John' });
        (getUserWishlist as jest.Mock).mockResolvedValue([{ id: 1 }]);
        (getCartData as jest.Mock).mockResolvedValue({ books: [{ id: 'b1' }], error: null });

        const component = await SessionProviderWrapper({ children: <div /> });
        render(component);

        await waitFor(() => {
            const data = getSessionData();
            expect(data.initialUser.first_name).toBe('John');
            expect(data.initialWishlist.length).toBe(1);
            expect(data.initialCart).not.toBeNull();
        });
    });

    it('should handle the guest branch and provide "guest" as the key', async () => {
        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
            },
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
