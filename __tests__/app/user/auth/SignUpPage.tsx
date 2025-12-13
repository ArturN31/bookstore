import SignUpPage from '@/app/user/auth/signup/page';
import { SignUpFormState } from '@/data/actions/auth/SignUpAction';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MOCK_MESSAGE = 'Please correct the errors below.';

let mockReturnState: SignUpFormState = {
	email: 'test@gmail.com',
	password: 'test1',
	cnfPassword: 'test1',
	message: MOCK_MESSAGE,
	error: undefined,
	validationErrors: undefined,
};

jest.mock('@/data/actions/auth/SignUpAction', () => ({
	SignUpAction: jest.fn(async (prevState, formData) => {
		const reset = formData.get('reset');
		if (reset === 'yes') {
			return {
				email: '',
				password: '',
				cnfPassword: '',
				message: undefined,
				error: undefined,
				validationErrors: undefined,
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

describe('APP - Auth - SignUp', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockReturnState = {
			email: 'test@gmail.com',
			password: 'test1',
			cnfPassword: 'test1',
			message: MOCK_MESSAGE,
			error: undefined,
			validationErrors: undefined,
		};
	});

	it('should set formError state and display message when the form action returns a message', async () => {
		render(<SignUpPage />);

		expect(screen.queryByTestId('form-error-display')).not.toBeInTheDocument();

		const emailField = screen.getByTestId('email-field');
		const passwordField = screen.getByTestId('password-field');
		const cnfPasswordField = screen.getByTestId('cnfPassword-field');

		fireEvent.change(emailField, { target: { value: 'invalid@email' } });
		fireEvent.change(passwordField, { target: { value: 'ValidP@ss1' } });
		fireEvent.change(cnfPasswordField, { target: { value: 'ValidP@ss1' } });

		const signupForm = screen.getByTestId('signup-form');
		fireEvent.submit(signupForm);

		await waitFor(() => {
			const errorDisplay = screen.getByTestId('form-error-display');
			expect(errorDisplay).toBeInTheDocument();
			expect(errorDisplay).toHaveTextContent(MOCK_MESSAGE);
		});
	});

	it('should reset the formState to Default on resetBtn click', async () => {
		render(<SignUpPage />);

		const emailField = screen.getByTestId('email-field') as HTMLInputElement;
		const passwordField = screen.getByTestId('password-field') as HTMLInputElement;
		const cnfPasswordField = screen.getByTestId('cnfPassword-field') as HTMLInputElement;

		fireEvent.change(emailField, { target: { value: 'test@gmail.com@' } });
		fireEvent.change(passwordField, { target: { value: 'ValidP@ss1' } });
		fireEvent.change(cnfPasswordField, { target: { value: 'ValidP@ss1' } });

		const resetBtn = screen.getByTestId('reset-btn');
		fireEvent.click(resetBtn);

		await waitFor(() => {
			expect(emailField.value).toBe('');
			expect(passwordField.value).toBe('');
			expect(cnfPasswordField.value).toBe('');
		});
	});

	it('should fall back to empty string when password state is null', async () => {
		mockReturnState = {
			email: null,
			password: null,
			cnfPassword: null,
			message: MOCK_MESSAGE,
			error: undefined,
			validationErrors: undefined,
		} as any;

		render(<SignUpPage />);

		const signupForm = screen.getByTestId('signup-form');
		fireEvent.submit(signupForm);

		await waitFor(() => {
			const emailField = screen.getByTestId('email-field') as HTMLInputElement;
			const passwordField = screen.getByTestId('password-field') as HTMLInputElement;
			const cnfPasswordField = screen.getByTestId(
				'cnfPassword-field',
			) as HTMLInputElement;

			expect(emailField.defaultValue).toBe('');
			expect(passwordField.defaultValue).toBe('');
			expect(cnfPasswordField.defaultValue).toBe('');

			expect(emailField.value).toBe('');
			expect(passwordField.value).toBe('');
			expect(cnfPasswordField.value).toBe('');
		});
	});
});
