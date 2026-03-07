import UserProfile from '@/app/user/profile/page';
import { getUserData } from '@/data/user/GetUserData';
import { createBackendClient } from '@/utils/db/server';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';

const mockUserData: User = {
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

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

const mockGetSession = jest.fn();

jest.mock('@/utils/db/server', () => ({
    createBackendClient: jest.fn(() => ({
        auth: {
            getSession: mockGetSession,
        },
    })),
}));

jest.mock('@/data/user/GetUserData', () => ({
    getUserData: jest.fn(),
}));

jest.mock('@/components/pages/user/profile/UserProfilePage/UserProfilePage', () => ({
    UserProfilePage: jest.fn(),
}));

jest.mock('@/components/pages/user/profile/AddressForm/AddressForm', () => ({
    AddressForm: jest.fn(({ mode }) => (
        <div data-testid="add-address-form">Mock Address Form - {mode}</div>
    )),
}));

jest.mock('@/components/pages/user/profile/UserProfilePage/UserProfilePage', () => ({
    UserProfilePage: jest.fn(({ userData }) => (
        <div data-testid="user-profile-info">Profile for {userData.first_name}</div>
    )),
}));

jest.mock('@/data/actions/AddressForm/UserAddressAction', () => ({
    UserAddressAction: jest.fn(async (prevState, formData) => {
        return {};
    }),
}));

jest.mock('@/providers/user/UserProvider', () => ({
    useUserState: jest.fn(() => ({
        username: 'testuser',
    })),
}));

describe('APP - User - UserProfile', () => {
    const mockedCreateClient = createBackendClient as jest.Mock;
    const mockedGetUserData = getUserData as jest.Mock;
    const mockedRedirect = redirect as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render user profile page (profile EXISTS)', async () => {
        mockedCreateClient.mockReturnValue({
            auth: {
                getSession: jest.fn().mockResolvedValue({
                    data: { session: { user: { email: 'test@test.com' } } },
                }),
            },
        });
        mockedGetUserData.mockResolvedValue(mockUserData);

        render(await UserProfile());

        expect(screen.getByTestId('user-profile-info')).toBeInTheDocument();
        expect(mockedRedirect).not.toHaveBeenCalled();
    });

    it('should render the AddressInsertForm (profile does NOT exist)', async () => {
        mockedCreateClient.mockReturnValue({
            auth: {
                getSession: jest.fn().mockResolvedValue({
                    data: { session: { user: { email: 'test@test.com' } } },
                }),
            },
        });
        mockedGetUserData.mockResolvedValue(null);

        render(await UserProfile());

        expect(screen.getByTestId('no-user-profile-info')).toBeInTheDocument();
        expect(screen.getByTestId('add-address-form')).toBeInTheDocument();
    });
});
