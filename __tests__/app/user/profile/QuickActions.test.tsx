import { QuickActions } from '@/app/user/profile/components/UserProfilePage/QuickActions/QuickActions';
import { screen, render } from '@testing-library/react';

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

describe('APP - pages/user - QuickActions', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    it('should render component', () => {
        render(<QuickActions />);

        const changePasswordLink = screen.getByRole('link', { name: /Change Password/i });
        const changeAddressLink = screen.getByRole('link', { name: /Change Address/i });
        const changeUsernameLink = screen.getByRole('link', { name: /Change Username/i });

        expect(changePasswordLink).toHaveAttribute('href', '/user/auth/change_password');
        expect(changeAddressLink).toHaveAttribute('href', '/user/profile/change_address');
        expect(changeUsernameLink).toHaveAttribute('href', '/user/profile/change_username');
    });
});
