import ChangeUsernamePage from '@/app/user/profile/change_username/page';
import { ChangeUsernameFormState } from '@/data/actions/UsernameForm/ChangeUsernameAction';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MOCK_MESSAGE = 'Please correct the errors below.';

let mockReturnState: ChangeUsernameFormState = {
	username: '',
	message: MOCK_MESSAGE,
	error: undefined,
	validationErrors: undefined,
	isUsernameTaken: false,
};

jest.mock('@/data/actions/UsernameForm/ChangeUsernameAction', () => ({
	ChangeUsernameAction: jest.fn(async (prevState, formData) => {
		const reset = formData.get('reset');
		if (reset === 'yes') {
			return {
				username: '',
				message: MOCK_MESSAGE,
				error: undefined,
				validationErrors: undefined,
				isUsernameTaken: false,
			};
		}
		return mockReturnState;
	}),
}));

jest.mock('react', () => {
	const originalReact = jest.requireActual('react');

	return {
		...originalReact,
		useActionState: (actionFn: any, initialState: any) => {
			const [state, setState] = originalReact.useState(initialState);

			const formAction = async (formData: FormData) => {
				const newState = await actionFn(state, formData);
				setState(newState);
			};

			return [state, formAction];
		},
		useTransition: () => [false, (callback: any) => callback()],
	};
});

describe('APP - User - ChangeUsernamePage', () => {
	it('should set formError state and display message when the form action returns a message', async () => {
		render(<ChangeUsernamePage />);

		const usernameField = screen.getByTestId('username-field');

		fireEvent.change(usernameField, { target: { value: 'ab' } });

		const changeUsernameForm = screen.getByTestId('change-username-form');
		fireEvent.submit(changeUsernameForm);

		await waitFor(() => {
			const errorDisplay = screen.getByTestId('form-error-display');
			expect(errorDisplay).toBeInTheDocument();
			expect(errorDisplay).toHaveTextContent(MOCK_MESSAGE);
		});
	});

	it('should reset the formState to Default on resetBtn click', async () => {
		render(<ChangeUsernamePage />);

		const usernameField = screen.getByTestId('username-field') as HTMLInputElement;

		fireEvent.change(usernameField, { target: { value: 'test' } });

		const resetBtn = screen.getByTestId('reset-btn');
		fireEvent.click(resetBtn);

		await waitFor(() => {
			expect(usernameField.value).toBe('');
		});
	});

	it('should fall back to empty string when password state is null', async () => {
		mockReturnState = {
			username: null,
			message: MOCK_MESSAGE,
			error: undefined,
			validationErrors: undefined,
			isUsernameTaken: false,
		} as any;

		render(<ChangeUsernamePage />);

		const changeUsernameForm = screen.getByTestId('change-username-form');
		fireEvent.submit(changeUsernameForm);

		await waitFor(() => {
			const usernameField = screen.getByTestId('username-field') as HTMLInputElement;

			expect(usernameField.defaultValue).toBe('');

			expect(usernameField.value).toBe('');
		});
	});
});
