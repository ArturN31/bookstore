import UserProfile from '@/app/user/profile/page';
import { getUserData, getUserDataProperty } from '@/data/user/GetUserData';
import { render, screen } from '@testing-library/react';

const mockUserEmail = 'mock@email.com';
const mockUserData: User = {
	id: 'user_id_123',
	created_at: new Date(),
	updated_at: new Date(),
	first_name: 'John',
	last_name: 'Doe',
	date_of_birth: '2000-01-01',
	street_address: '123 Main St',
	postcode: '12345',
	city: 'Anytown',
	country: 'USA',
	phone_number: '555-1234',
	username: 'johndoe',
};

let capturedUpdateCallback: (() => Promise<void>) | null = null;
const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn(() => ({ unsubscribe: mockUnsubscribe }));
const mockOn = jest.fn((event, filter, callback) => {
	if (event === 'postgres_changes' && filter.event === 'INSERT') {
		capturedUpdateCallback = callback;
	}
	return { subscribe: mockSubscribe };
});
jest.mock('@/utils/db/server', () => ({
	createClient: jest.fn(() => ({
		channel: jest.fn(() => ({
			on: mockOn,
		})),
	})),
}));

jest.mock('@/data/actions/AddressForm/AddAddressAction', () => ({
	AddAddressAction: jest.fn(async (prevState, formData) => {
		return {};
	}),
}));

const mockUpdatedUserData = { ...mockUserData, first_name: 'Jane' };
const mockUpdatedUserEmail = 'jane@email.com';
const mockedGetUserDataProperty = getUserDataProperty as jest.Mock;
const mockedGetUserData = getUserData as jest.Mock;
jest.mock('@/data/user/GetUserData', () => ({
	getUserDataProperty: jest.fn(),
	getUserData: jest.fn(),
}));

jest.mock('@/components/pages/profile/UserProfilePage', () => ({
	UserProfilePage: ({ userData, userEmail }: any) => (
		<div data-testid='user-profile-info'>
			Profile Loaded: {userData.first_name} | {userEmail}
		</div>
	),
}));

jest.mock('@/components/pages/profile/AddAddressForm', () => ({
	AddAddressForm: () => <div data-testid='mock-add-address-form'></div>,
}));

jest.mock('@/providers/UserProvider', () => ({
	useUserState: jest.fn(() => ({
		username: 'testuser',
	})),
}));

describe('APP - User - UserProfile', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		capturedUpdateCallback = null;
		mockedGetUserData.mockResolvedValue(mockUserData);
		mockedGetUserDataProperty.mockResolvedValue(mockUserEmail);
	});

	it('should render user profile page (profile EXISTS)', async () => {
		render(await UserProfile());

		expect(screen.getByTestId('user-profile-info')).toBeInTheDocument();
		expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
		expect(capturedUpdateCallback).not.toBeNull();
	});

	it('should render the AddressInsertForm (profile does NOT exist)', async () => {
		mockedGetUserData.mockResolvedValue(null);
		mockedGetUserDataProperty.mockResolvedValue(mockUserEmail);

		render(await UserProfile());

		expect(screen.getByTestId('no-user-profile-info')).toBeInTheDocument();
		expect(screen.getByTestId('mock-add-address-form')).toBeInTheDocument();
		expect(screen.queryByTestId('user-profile-info')).not.toBeInTheDocument();
	});

	it('should call handleDataUpdate when a change event is received', async () => {
		render(await UserProfile());

		expect(capturedUpdateCallback).not.toBeNull();
		expect(mockedGetUserData).toHaveBeenCalledTimes(1);

		mockedGetUserData.mockResolvedValueOnce(mockUpdatedUserData);
		mockedGetUserDataProperty.mockResolvedValueOnce(mockUpdatedUserEmail);

		mockedGetUserData.mockClear();
		mockedGetUserDataProperty.mockClear();

		if (capturedUpdateCallback) {
			await capturedUpdateCallback();
		}

		expect(mockedGetUserData).toHaveBeenCalledTimes(1);
		expect(mockedGetUserDataProperty).toHaveBeenCalledTimes(1);
	});
});
