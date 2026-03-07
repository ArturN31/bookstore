import { QuickActions } from '@/components/pages/user/profile/UserProfilePage/QuickActions';
import { screen, render } from '@testing-library/react';

describe('APP - pages/user - QuickActions', () => {
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
