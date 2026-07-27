import { UserNavbar } from '@/components/layout/UserNavbar/UserNavbar';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useUserActions, useUserState } from '@/providers/user/utils/useUser';
import { render } from '@testing-library/react';

// Hoisted mock polyfills global.Request before Next.js cache modules evaluate in Node/Jest
jest.mock('next/cache', () => {
    if (typeof global.Request === 'undefined') {
        class MockRequest {
            public url: string;
            constructor(input: string | { url: string }) {
                this.url = typeof input === 'string' ? input : input?.url || '';
            }
        }
        Object.defineProperty(global, 'Request', {
            value: MockRequest,
            writable: true,
            configurable: true,
        });
    }
    return {
        unstable_cache: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => fn,
        revalidateTag: jest.fn(),
        revalidatePath: jest.fn(),
    };
});

jest.mock('@/data/actions/CartForm/CartAction', () => ({
    CartAction: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
    usePathname: jest.fn(),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(),
    useUserActions: jest.fn(),
}));

jest.mock('@/providers/cart/utils/useCart', () => ({
    useCartState: jest.fn(),
    useCartActions: jest.fn(),
}));

describe('APP - Layout - UserNavbar', () => {
    const mockUseUserState = useUserState as jest.Mock;
    const mockUseUserActions = useUserActions as jest.Mock;
    const mockUseCartState = useCartState as jest.Mock;
    const mockUseCartActions = useCartActions as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseUserState.mockReturnValue({
            loggedIn: true,
            profileExists: true,
            loading: false,
        });

        mockUseUserActions.mockReturnValue({
            signOut: jest.fn().mockResolvedValue(undefined),
            refreshProfile: jest.fn(),
        });

        mockUseCartState.mockReturnValue({
            cartBooks: [],
            cartItemsAmount: 0,
        });

        mockUseCartActions.mockReturnValue({
            refreshCart: jest.fn(),
        });
    });

    it('Should render component', () => {
        render(<UserNavbar />);
    });
});
