import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { getUserData } from '@/data/user/UserService';
import { checkIsOwner } from '@/utils/auth/checkOwnership';
import { OrderWithRelations } from '@/data/checkout/CheckoutTypes';
import UserOrdersPage from '@/app/user/orders/page';

jest.mock('next/navigation', () => ({
    redirect: jest.fn().mockImplementation((url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`);
    }),
}));

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(),
}));

const mockRange = jest.fn();
const mockOrderFn = jest.fn().mockReturnValue({ range: mockRange });
const mockEq = jest.fn().mockReturnValue({ order: mockOrderFn });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (callback: () => Promise<unknown>) => {
        return await callback();
    }),
}));

jest.mock('@/data/user/UserService', () => ({
    getUserData: jest.fn(),
}));

jest.mock('@/utils/auth/checkOwnership', () => ({
    checkIsOwner: jest.fn(),
}));

describe('UserOrdersPage', () => {
    const mockRedirect = jest.mocked(redirect);
    const mockCreateBackendClient = jest.mocked(createBackendClient);
    const mockGetUserData = jest.mocked(getUserData);
    const mockCheckIsOwner = jest.mocked(checkIsOwner);

    const mockUser = {
        id: 'user-1',
        username: 'johndoe',
        email: 'john@example.com',
    } as unknown as NonNullable<Awaited<ReturnType<typeof getUserData>>['data']>;

    const mockOrder: OrderWithRelations = {
        id: 'ORD-001',
        user_id: 'user-1',
        status: 'PROCESSING',
        created_at: '2026-01-01T00:00:00Z',
        payment_method: 'card',
        total_amount: 29.99,
        order_items: [],
        order_discounts: [],
        discount_amount: 0,
        shipping_cost: 0,
        shipping_method_id: 'ship-1',
        shipping_method_name: 'Standard Delivery',
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        subtotal: 29.99,
        tax_amount: 0,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateBackendClient.mockResolvedValue({
            from: mockFrom,
        } as unknown as Awaited<ReturnType<typeof createBackendClient>>);
    });

    it('redirects to /user/profile if getUserData fails or returns no user', async () => {
        mockGetUserData.mockResolvedValueOnce({ data: null, error: 'Unauthorized' });

        await expect(
            UserOrdersPage({ params: Promise.resolve({ username: 'johndoe' }) }),
        ).rejects.toThrow('NEXT_REDIRECT:/user/profile');

        expect(mockRedirect).toHaveBeenCalledWith('/user/profile');
    });

    it('redirects to /user/profile if user is not the owner', async () => {
        mockGetUserData.mockResolvedValueOnce({ data: mockUser, error: null });
        mockCheckIsOwner.mockResolvedValueOnce(false);

        await expect(
            UserOrdersPage({ params: Promise.resolve({ username: 'johndoe' }) }),
        ).rejects.toThrow('NEXT_REDIRECT:/user/profile');

        expect(mockCheckIsOwner).toHaveBeenCalledWith('johndoe');
        expect(mockRedirect).toHaveBeenCalledWith('/user/profile');
    });

    it('renders error banner when orders query fails', async () => {
        mockGetUserData.mockResolvedValueOnce({ data: mockUser, error: null });
        mockCheckIsOwner.mockResolvedValueOnce(true);
        mockRange.mockResolvedValueOnce({
            data: null,
            error: 'Database error',
        });

        const pageComponent = await UserOrdersPage({
            params: Promise.resolve({ username: 'johndoe' }),
        });

        render(pageComponent);

        expect(
            screen.getByText('Failed to load order details. Please try again later.'),
        ).toBeInTheDocument();
    });

    it('renders no orders state when orders list is empty', async () => {
        mockGetUserData.mockResolvedValueOnce({ data: mockUser, error: null });
        mockCheckIsOwner.mockResolvedValueOnce(true);
        mockRange.mockResolvedValueOnce({
            data: [],
            error: null,
        });

        const pageComponent = await UserOrdersPage({
            params: Promise.resolve({ username: 'johndoe' }),
        });

        render(pageComponent);

        expect(screen.getByText('No Orders yet')).toBeInTheDocument();
        expect(screen.getByText("This user hasn't placed any orders yet.")).toBeInTheDocument();
    });

    it('renders list of orders successfully covering fallbacks and pagination slice when raw orders exceed page size', async () => {
        mockGetUserData.mockResolvedValueOnce({ data: mockUser, error: null });
        mockCheckIsOwner.mockResolvedValueOnce(true);

        const ordersList: OrderWithRelations[] = Array.from({ length: 6 }, (_, index) => ({
            ...mockOrder,
            id: `ORD-00${index + 1}`,
            payment_method: index === 1 ? (null as unknown as string) : 'paypal',
            shipping_method_name: index === 1 ? (null as unknown as string) : 'Express Delivery',
        }));

        mockRange.mockResolvedValueOnce({
            data: ordersList,
            error: null,
        });

        const pageComponent = await UserOrdersPage({
            params: Promise.resolve({ username: 'johndoe' }),
        });

        render(pageComponent);

        expect(screen.getByText("johndoe's Orders")).toBeInTheDocument();
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('ORD-005')).toBeInTheDocument();
        expect(screen.queryByText('ORD-006')).not.toBeInTheDocument();
        expect(screen.getByText('CARD')).toBeInTheDocument();
        expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
    });
});
