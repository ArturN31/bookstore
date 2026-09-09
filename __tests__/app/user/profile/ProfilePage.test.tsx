import UserProfile from '@/app/user/profile/page';
import { getUserData } from '@/data/user/UserService';
import { render, screen } from '@testing-library/react';

const mockUserData = {
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

jest.mock('@/data/user/UserService', () => ({
    getUserData: jest.fn(),
}));

jest.mock('@/components/ui/ErrorState', () => ({
    ErrorState: ({ title, message }: { title: string; message: string }) => (
        <div data-testid="error-state">
            <h1>{title}</h1>
            <p>{message}</p>
        </div>
    ),
}));

jest.mock('@/app/user/profile/components/OnboardingForm/OnboardingForm', () => ({
    OnboardingForm: ({ mode }: { mode: string }) => (
        <div data-testid="add-address-form">Mock Onboarding Form - {mode}</div>
    ),
}));

jest.mock('@/app/user/profile/components/UserProfilePage/QuickActions/QuickActions', () => ({
    QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

jest.mock('@/app/user/profile/components/UserProfilePage/UserDetails', () => ({
    UserDetails: () => <div data-testid="user-profile-info">User Details</div>,
}));

describe('APP - User - ProfilePage', () => {
    const mockedGetUserData = getUserData as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render user profile page when profile exists', async () => {
        mockedGetUserData.mockResolvedValue({ data: mockUserData, error: null });

        render(await UserProfile());

        expect(screen.getByTestId('user-profile-info')).toBeInTheDocument();
        expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    it('should render the OnboardingForm when profile does not exist', async () => {
        mockedGetUserData.mockResolvedValue({ data: null, error: null });

        render(await UserProfile());

        expect(screen.getByTestId('no-user-profile-info')).toBeInTheDocument();
        expect(screen.getByTestId('add-address-form')).toBeInTheDocument();
    });

    it('should render ErrorState when serverError is not the default message', async () => {
        mockedGetUserData.mockResolvedValue({
            data: null,
            error: 'Custom database error',
        });

        render(await UserProfile());

        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText(/Profile Error/i)).toBeInTheDocument();
        expect(screen.getByText(/Custom database error/i)).toBeInTheDocument();
    });
});
