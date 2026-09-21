import { ProfileCardHeader } from '@/app/user/profile/public/[username]/components/ProfileCard/ProfileCardHeader';
import { render, screen } from '@testing-library/react';

describe('ProfileCardHeader', () => {
    it('renders the title and subtitle correctly with default icon styling', () => {
        render(
            <ProfileCardHeader
                icon={<span data-testid="test-icon">icon</span>}
                title="Test Title"
                subtitle="Test Subtitle"
            />,
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('applies custom icon container className when provided', () => {
        render(
            <ProfileCardHeader
                icon={<span>icon</span>}
                title="Custom Styled Title"
                subtitle="Custom Styled Subtitle"
                iconContainerClassName="custom-class-name"
            />,
        );

        expect(screen.getByText('Custom Styled Title')).toBeInTheDocument();
        expect(screen.getByText('Custom Styled Subtitle')).toBeInTheDocument();
    });
});
