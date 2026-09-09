import { ProfileCardContainer } from '@/app/user/profile/public/[username]/components/ProfileCard/ProfileCardContainer';
import { render, screen } from '@testing-library/react';

describe('ProfileCardContainer', () => {
    it('renders children correctly with default amber color theme', () => {
        render(
            <ProfileCardContainer>
                <div data-testid="child-content">Child Content</div>
            </ProfileCardContainer>,
        );

        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders correctly with explicit alternative color themes', () => {
        const { rerender } = render(
            <ProfileCardContainer colorTheme="blue">
                <div>Blue Theme</div>
            </ProfileCardContainer>,
        );
        expect(screen.getByText('Blue Theme')).toBeInTheDocument();

        rerender(
            <ProfileCardContainer colorTheme="purple">
                <div>Purple Theme</div>
            </ProfileCardContainer>,
        );
        expect(screen.getByText('Purple Theme')).toBeInTheDocument();

        rerender(
            <ProfileCardContainer colorTheme="emerald">
                <div>Emerald Theme</div>
            </ProfileCardContainer>,
        );
        expect(screen.getByText('Emerald Theme')).toBeInTheDocument();
    });
});
