import { UserDetails } from '@/components/pages/user/profile/UserProfilePage/UserDetails';
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
        render(<UserDetails userData={mockedUserData} />);

        expect(screen.getByText('John Doe'));
        expect(screen.getByText('123 Main St, Anytown, USA'));
    });

    it('should show fallback copy when optional details are missing', () => {
        render(
            <UserDetails
                userData={{
                    ...mockedUserData,
                    first_name: '',
                    last_name: '',
                    date_of_birth: '',
                    street_address: '',
                    city: '',
                    country: '',
                    phone_number: '',
                    email: '',
                }}
            />,
        );

        expect(screen.getAllByText('Not provided').length).toBeGreaterThan(0);
    });

    it('should display fallback text for invalid birth dates', () => {
        render(<UserDetails userData={{ ...mockedUserData, date_of_birth: 'not-a-date' }} />);

        expect(screen.getByText('Not provided')).toBeTruthy();
    });
});
