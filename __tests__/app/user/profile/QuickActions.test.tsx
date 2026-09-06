import { QuickActions } from '@/app/user/profile/components/UserProfilePage/QuickActions/QuickActions';
import { screen, render, act } from '@testing-library/react';

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/data/user/UserService', () => ({
    getUserData: jest.fn().mockResolvedValue({
        data: { username: 'testuser' },
    }),
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

    it('should render component', async () => {
        await act(async () => {
            render(await QuickActions());
        });

        const changePasswordLink = await screen.findByRole('link', { name: /Change Password/i });
        const changeAddressLink = await screen.findByRole('link', { name: /Change Address/i });
        const myReviewsLink = await screen.findByRole('link', { name: /My Book Reviews/i });

        expect(changePasswordLink).toHaveAttribute('href', '/user/auth/change_password');
        expect(changeAddressLink).toHaveAttribute('href', '/user/profile/change_address');
        expect(myReviewsLink).toHaveAttribute('href', '/user/content/reviews');
    });
});
