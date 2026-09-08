import { render, screen } from '@testing-library/react';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import { ProfileCardActionButton } from '@/app/user/[username]/components/ProfileCard/ProfileCardActionButton';

describe('ProfileCardActionButton', () => {
    it('renders the link with correct href and text children', () => {
        render(
            <ProfileCardActionButton
                href="/test-path"
                icon={<CardGiftcardOutlinedIcon data-testid="test-icon" />}
            >
                Click Me
            </ProfileCardActionButton>,
        );

        const linkElement = screen.getByRole('link', { name: /click me/i });
        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveAttribute('href', '/test-path');

        const iconElement = screen.getByTestId('test-icon');
        expect(iconElement).toBeInTheDocument();
    });
});
