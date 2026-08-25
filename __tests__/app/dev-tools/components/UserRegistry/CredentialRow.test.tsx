import { impulseLogin } from '@/app/dev-tools/actions/DevToolsActions';
import { CredentialRow } from '@/app/dev-tools/components/UserRegistry/CredentialRow';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

jest.mock('@/app/dev-tools/actions/DevToolsActions', () => ({
    impulseLogin: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

const mockImpulseLogin = jest.mocked(impulseLogin);
const mockUseRouter = jest.mocked(useRouter);

describe('CredentialRow', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRouter.mockReturnValue({
            push: mockPush,
        } as unknown as ReturnType<typeof useRouter>);
        window.alert = jest.fn();
    });

    it('should render primary variant correctly', () => {
        render(
            <CredentialRow
                value="admin@root.com"
                label="Master_Root_Access"
                isPrimary={true}
            />,
        );

        expect(screen.getByText('Master_Root_Access')).toBeInTheDocument();
        expect(screen.getByText('admin@root.com')).toBeInTheDocument();
        expect(screen.getByText('Login_Impulse')).toBeInTheDocument();
    });

    it('should render minimal variant correctly when not primary', () => {
        render(<CredentialRow value="user@test.com" />);

        expect(screen.getByText('user@test.com')).toBeInTheDocument();
        expect(screen.queryByText('Login_Impulse')).not.toBeInTheDocument();
    });

    it('should show SYNCING... when logging in on primary variant', async () => {
        let resolveLogin: (value: { success: boolean }) => void = () => {};
        const loginPromise = new Promise<{ success: boolean }>((resolve) => {
            resolveLogin = resolve;
        });
        mockImpulseLogin.mockReturnValueOnce(loginPromise);

        render(
            <CredentialRow
                value="admin@root.com"
                label="Master_Root_Access"
                isPrimary={true}
            />,
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(screen.getByText('SYNCING...')).toBeInTheDocument();

        resolveLogin({ success: true });
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('should handle successful login and redirect via router.push', async () => {
        mockImpulseLogin.mockResolvedValueOnce({ success: true });

        render(<CredentialRow value="user@test.com" />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockImpulseLogin).toHaveBeenCalledWith('user@test.com');
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('should handle login error, alert user, and reset loading state', async () => {
        mockImpulseLogin.mockRejectedValueOnce(new Error('Network error'));

        render(<CredentialRow value="user@test.com" />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Auth sequence interrupted.');
            expect(mockPush).not.toHaveBeenCalled();
            expect(button).not.toBeDisabled();
        });
    });
});
