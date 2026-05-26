import { UserBtn } from '@/components/layout/UserNavbar/UserBtn';
import { useUserActions, useUserState } from '@/providers/user/utils/useUser';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';

const mockRouterPush = jest.fn();
const mockRouterRefresh = jest.fn(); // Add this
const mockUsePathname = usePathname as jest.Mock;

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
        refresh: mockRouterRefresh,
    }),
    usePathname: jest.fn(),
}));

jest.mock('@/providers/user/utils/useUser', () => ({
    useUserState: jest.fn(),
    useUserActions: jest.fn(),
}));

jest.mock('@/components/ui/CustomPopoverWithList', () => ({
    CustomPopoverWithList: ({ listToRender, listItemOnClick }: any) => (
        <div>
            <button data-testid="popover-icon-btn">Open</button>
            {listToRender?.map((choice: string) => (
                <button
                    key={choice}
                    data-testid={`popover-icon-choice-${choice.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => listItemOnClick(choice)}
                >
                    {choice}
                </button>
            ))}
            <button
                data-testid="popover-choice-unknown"
                onClick={() => listItemOnClick('InvalidChoice')}
            >
                Unknown
            </button>
        </div>
    ),
}));

describe('layout - UserNavbar - UserBtn', () => {
    const mockUseUserState = useUserState as jest.Mock;
    const mockUseUserActions = useUserActions as jest.Mock;
    const mockSignOut = jest.fn();

    const loadingState = {
        loggedIn: false,
        signOut: jest.fn(),
        loading: true,
    };

    const defaultLoggedInState = {
        loggedIn: true,
        signOut: jest.fn(),
        loading: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseUserState.mockReturnValue({
            loggedIn: false,
            loading: false,
        });

        mockUseUserActions.mockReturnValue({
            signOut: mockSignOut,
        });
    });

    it('Should navigate to sign in page on click (not logged in)', async () => {
        render(<UserBtn />);
        await act(async () => {
            await fireEvent.click(screen.getByTestId('popover-icon-btn'));
        });
        await act(async () => {
            await fireEvent.click(screen.getByTestId('popover-icon-choice-sign-in'));
        });
        expect(mockRouterPush).toHaveBeenCalledWith('/user/auth/signin?returnTo=undefined');
    });

    it('Should navigate to user profile page on click (logged in required)', () => {
        mockUseUserState.mockReturnValue(defaultLoggedInState);
        render(<UserBtn />);
        fireEvent.click(screen.getByTestId('popover-icon-btn'));
        fireEvent.click(screen.getByTestId('popover-icon-choice-user-profile'));
        expect(mockRouterPush).toHaveBeenCalledWith('/user/profile');
    });

    it('Should navigate to wishlist page on click (logged in required)', async () => {
        mockUseUserState.mockReturnValue(defaultLoggedInState);
        render(<UserBtn />);
        await act(async () => {
            await fireEvent.click(screen.getByTestId('popover-icon-btn'));
        });
        await act(async () => {
            await fireEvent.click(screen.getByTestId('popover-icon-choice-wishlist'));
        });
        expect(mockRouterPush).toHaveBeenCalledWith('/user/wishlist');
    });

    it('should navigate to home on default case (unrecognized choice)', () => {
        render(<UserBtn />);

        fireEvent.click(screen.getByTestId('popover-choice-unknown'));

        expect(mockRouterPush).toHaveBeenCalledWith('/');
    });

    it('Should display loading state', () => {
        mockUseUserState.mockReturnValue(loadingState);
        render(<UserBtn />);

        expect(screen.getByTestId('popover-icon-btn')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('Should call signOut and navigate to home on "Sign Out" click', async () => {
        mockUsePathname.mockReturnValue('/user/settings');

        const localMockSignOut = jest.fn().mockResolvedValue(undefined);
        mockUseUserActions.mockReturnValue({
            signOut: localMockSignOut,
        });
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            loading: false,
        });

        render(<UserBtn />);

        fireEvent.click(screen.getByTestId('popover-icon-btn'));
        const signOutBtn = screen.getByTestId('popover-icon-choice-sign-out');

        fireEvent.click(signOutBtn);

        await waitFor(() => {
            expect(localMockSignOut).toHaveBeenCalledTimes(1);
            expect(mockRouterPush).toHaveBeenCalledWith('/');
        });
    });

    it('should log an error to console when signOut fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockError = new Error('Network Error');

        const localMockSignOut = jest.fn().mockRejectedValue(mockError);
        mockUseUserActions.mockReturnValue({
            signOut: localMockSignOut,
        });
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            loading: false,
        });

        render(<UserBtn />);

        fireEvent.click(screen.getByTestId('popover-icon-btn'));

        const signOutBtn = screen.getByTestId('popover-icon-choice-sign-out');

        await act(async () => {
            fireEvent.click(signOutBtn);
        });

        expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', mockError);

        consoleSpy.mockRestore();
    });

    it('should do nothing when an item is clicked during loading state', () => {
        mockUseUserState.mockReturnValue({
            loggedIn: false,
            loading: true,
        });

        render(<UserBtn />);

        const loadingBtn = screen.getByTestId('popover-icon-choice-loading...');

        fireEvent.click(loadingBtn);

        expect(mockRouterPush).not.toHaveBeenCalled();
        expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('Should call router.refresh() when signing out from a non-user page', async () => {
        mockUsePathname.mockReturnValue('/public-page');

        const localMockSignOut = jest.fn().mockResolvedValue(undefined);
        mockUseUserActions.mockReturnValue({
            signOut: localMockSignOut,
        });
        mockUseUserState.mockReturnValue({
            loggedIn: true,
            loading: false,
        });

        render(<UserBtn />);

        fireEvent.click(screen.getByTestId('popover-icon-btn'));
        const signOutBtn = screen.getByTestId('popover-icon-choice-sign-out');
        fireEvent.click(signOutBtn);

        await waitFor(() => {
            expect(localMockSignOut).toHaveBeenCalled();
            expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
            expect(mockRouterPush).not.toHaveBeenCalledWith('/');
        });
    });
});
