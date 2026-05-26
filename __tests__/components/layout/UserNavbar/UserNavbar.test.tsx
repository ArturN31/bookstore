import { UserNavbar } from '@/components/layout/UserNavbar/UserNavbar';
import { useCartActions, useCartState } from '@/providers/cart/utils/useCart';
import { useUserActions, useUserState } from '@/providers/user/utils/useUser';
import { render } from '@testing-library/react';

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
