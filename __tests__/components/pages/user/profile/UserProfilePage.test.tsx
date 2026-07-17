import { UserProfilePage } from '@/components/pages/user/profile/UserProfilePage/UserProfilePage';
import { screen, render } from '@testing-library/react';

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
};

describe('APP - pages/user - UserDetails', () => {
    it('should render component', () => {
        render(<UserProfilePage userData={mockedUserData} />);

        expect(screen.getByText('Welcome back!'));
        expect(screen.getByRole('heading', { name: 'johndoe' }));
    });
});
