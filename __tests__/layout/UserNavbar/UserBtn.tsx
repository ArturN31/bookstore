import { UserBtn } from '@/components/layout/UserNavbar/UserBtn';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as UserData from '../../../data/user/GetUserData';

const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockRouterPush,
	}),
}));

jest.mock('../../../data/user/GetUserData', () => ({
	logout: jest.fn(() => Promise.resolve(true)),
}));
const mockLogout = jest.mocked(UserData).logout;

const mockUseUserState = jest.fn();
jest.mock('../../../providers/UserProvider', () => ({
	useUserState: () => mockUseUserState(),
}));

describe('layout - UserNavbar - UserBtn', () => {
	const defaultLoggedOutState = {
		loggedIn: false,
		toggleLoggedIn: jest.fn(),
		clearUsername: jest.fn(),
	};

	const defaultLoggedInState = {
		loggedIn: true,
		toggleLoggedIn: jest.fn(),
		clearUsername: jest.fn(),
	};

	beforeEach(() => {
		mockLogout.mockImplementation(() => Promise.resolve(true));
		mockRouterPush.mockClear();
		mockLogout.mockClear();
		defaultLoggedOutState.toggleLoggedIn.mockClear();
		defaultLoggedOutState.clearUsername.mockClear();
		defaultLoggedInState.toggleLoggedIn.mockClear();
		defaultLoggedInState.clearUsername.mockClear();
		mockUseUserState.mockReturnValue(defaultLoggedOutState);
	});

	it('Shoould render the button', () => {
		render(<UserBtn />);
		const popoverBtn = screen.getByTestId('popover-icon-btn');
		expect(popoverBtn).toBeInTheDocument();
	});

	it('Should navigate to sign in page on click (not logged in)', () => {
		render(<UserBtn />);
		fireEvent.click(screen.getByTestId('popover-icon-btn'));
		fireEvent.click(screen.getByTestId('popover-icon-choice-sign-in'));
		expect(mockRouterPush).toHaveBeenCalledWith('/user/auth/signin');
	});

	it('Should navigate to user profile page on click (logged in required)', () => {
		mockUseUserState.mockReturnValue(defaultLoggedInState);
		render(<UserBtn />);
		fireEvent.click(screen.getByTestId('popover-icon-btn'));
		fireEvent.click(screen.getByTestId('popover-icon-choice-user-profile'));
		expect(mockRouterPush).toHaveBeenCalledWith('/user/profile');
	});

	it('Should navigate to wishlist page on click (logged in required)', () => {
		mockUseUserState.mockReturnValue(defaultLoggedInState);
		render(<UserBtn />);
		fireEvent.click(screen.getByTestId('popover-icon-btn'));
		fireEvent.click(screen.getByTestId('popover-icon-choice-wishlist'));
		expect(mockRouterPush).toHaveBeenCalledWith('/user/wishlist');
	});

	it('Should navigate to homepage on sign out click (logged in required - SUCCESS case)', async () => {
		mockUseUserState.mockReturnValue(defaultLoggedInState);

		render(<UserBtn />);
		fireEvent.click(screen.getByTestId('popover-icon-btn'));
		fireEvent.click(screen.getByTestId('popover-icon-choice-sign-out'));

		await waitFor(() => {
			expect(mockLogout).toHaveBeenCalledTimes(1);
			expect(defaultLoggedInState.toggleLoggedIn).toHaveBeenCalledWith(false);
			expect(defaultLoggedInState.clearUsername).toHaveBeenCalledTimes(1);
			expect(mockRouterPush).toHaveBeenCalledWith('/');
		});
	});

	it('Should NOT modify user state or navigate if sign out fails (res is falsy)', async () => {
		mockLogout.mockImplementation(() => Promise.resolve(false));
		mockUseUserState.mockReturnValue(defaultLoggedInState);

		render(<UserBtn />);
		fireEvent.click(screen.getByTestId('popover-icon-btn'));
		fireEvent.click(screen.getByTestId('popover-icon-choice-sign-out'));

		await waitFor(() => {
			expect(mockLogout).toHaveBeenCalledTimes(1);
			expect(defaultLoggedInState.toggleLoggedIn).not.toHaveBeenCalled();
			expect(defaultLoggedInState.clearUsername).not.toHaveBeenCalled();
			expect(mockRouterPush).not.toHaveBeenCalled();
		});
	});

	describe('handleChoice Default Case Test', () => {
		let MockedUserBtn: any;
		const mockListItemOnClick = jest.fn();

		beforeAll(() => {
			jest.resetModules();

			jest.doMock('../../../components/CustomPopoverWithList', () => ({
				CustomPopoverWithList: jest.fn(({ listItemOnClick }) => {
					mockListItemOnClick.mockImplementation(listItemOnClick);
					return <div data-testid='mock-popover-container'></div>;
				}),
			}));

			MockedUserBtn = require('../../../components/layout/UserNavbar/UserBtn').UserBtn;
		});

		beforeEach(() => {
			mockRouterPush.mockClear();
			mockListItemOnClick.mockClear();
			mockUseUserState.mockReturnValue(defaultLoggedOutState);
		});

		it('Should navigate to homepage when an unrecognized choice is made (default case)', () => {
			render(<MockedUserBtn />);

			mockListItemOnClick('NonExistentChoice');

			expect(mockRouterPush).toHaveBeenCalledWith('/');
			expect(mockRouterPush).toHaveBeenCalledTimes(1);
		});

		it('Should navigate to homepage', () => {
			render(<MockedUserBtn />);

			mockListItemOnClick('Homepage');

			expect(mockRouterPush).toHaveBeenCalledWith('/');
			expect(mockRouterPush).toHaveBeenCalledTimes(1);
		});

		afterAll(() => {
			jest.clearAllMocks();
			jest.resetModules();
		});
	});
});
