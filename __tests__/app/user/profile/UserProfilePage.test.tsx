import { UserProfilePage } from '@/app/user/profile/components/UserProfilePage/UserProfilePage';
import { screen, render } from '@testing-library/react';

jest.mock('@/providers/advancedFiltering/BookAdvancedFilteringProvider', () => ({
    BookAdvancedFilteringProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/app/user/profile/components/UserProfilePage/QuickActions/QuickActions', () => ({
    QuickActions: () => <div data-testid="mock-quick-actions" />,
}));

const mockedUserData: User = {
    id: 'user_id_123',
    created_at: new Date().toUTCString(),
    updated_at: new Date().toUTCString(),
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '2000-01-01',
    street_address: '123 Main St',
    postcode: '12345',
    city: 'Anytown',
    country: 'USA',
    phone_number: '555-1234',
    username: 'johndoe',
    email: 'user@test.com',
    is_wishlist_public: false,
    wishlist_share_token: null,
};

describe('APP - pages/user - UserDetails', () => {
    it('should render component', () => {
        render(<UserProfilePage userData={mockedUserData} />);

        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'johndoe' })).toBeInTheDocument();
    });
});
