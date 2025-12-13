import ChangePasswordPage from '@/app/user/auth/change_password/page';
import { ChangePasswordFormState } from '@/data/actions/auth/ChangePasswordAction';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MOCK_MESSAGE = 'Please correct the errors below.';

let mockReturnState: ChangePasswordFormState = {
	password: '',
	cnfPassword: '',
	message: MOCK_MESSAGE,
	error: undefined,
	validationErrors: undefined,
};

jest.mock('@/data/actions/auth/ChangePasswordAction', () => ({
	ChangePasswordAction: jest.fn(async (prevState, formData) => {
		const reset = formData.get('reset');
		if (reset === 'yes') {
			return {
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

jest.mock('@/components/formItems/PasswordField', () => ({
	PasswordField: (props: any) => (
		<input
			id={props.id}
			data-testid={`${props.id}-field`}
			{...props}
		/>
	),
}));

jest.mock('@/components/formItems/FormBtns', () => ({
	FormBtns: (props: any) => (
		<div className='flex justify-end gap-3 pt-4'>
			<button type='submit'>Save</button>
			<button
				data-testid='reset-btn'
				onClick={props.handleReset}>
				Clear
			</button>
		</div>
	),
}));

jest.mock('@/components/formItems/FormErrors', () => ({
	FormErrors: ({ formError }: any) =>
		formError ? <div data-testid='form-error-display'>{formError}</div> : null,
}));

describe('APP - Auth - ChangePasswordPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockReturnState = {
			password: '',
			cnfPassword: '',
			message: MOCK_MESSAGE,
			error: undefined,
			validationErrors: undefined,
		};
	});

	it('should set formError state and display message when the form action returns a message', async () => {
		render(<ChangePasswordPage />);

		expect(screen.queryByTestId('form-error-display')).not.toBeInTheDocument();

		const passwordField = screen.getByTestId('password-field');
		const cnfPasswordField = screen.getByTestId('cnfPassword-field');

		fireEvent.change(passwordField, { target: { value: 'ValidP@ss1' } });
		fireEvent.change(cnfPasswordField, { target: { value: 'ValidP@ss1' } });

		const changePasswordForm = screen.getByTestId('change-password-form');
		fireEvent.submit(changePasswordForm);

		await waitFor(() => {
			const errorDisplay = screen.getByTestId('form-error-display');
			expect(errorDisplay).toBeInTheDocument();
			expect(errorDisplay).toHaveTextContent(MOCK_MESSAGE);
		});
	});

	it('should reset the formState to Default on resetBtn click', async () => {
		render(<ChangePasswordPage />);

		const passwordField = screen.getByTestId('password-field') as HTMLInputElement;
		const cnfPasswordField = screen.getByTestId('cnfPassword-field') as HTMLInputElement;

		fireEvent.change(passwordField, { target: { value: 'ValidP@ss1' } });
		fireEvent.change(cnfPasswordField, { target: { value: 'ValidP@ss1' } });

		const resetBtn = screen.getByTestId('reset-btn');
		fireEvent.click(resetBtn);

		await waitFor(() => {
			expect(passwordField.value).toBe('');
			expect(cnfPasswordField.value).toBe('');
		});
	});

	it('should fall back to empty string when password state is null', async () => {
		mockReturnState = {
			password: null,
			cnfPassword: null,
			message: MOCK_MESSAGE,
			error: undefined,
			validationErrors: undefined,
		} as any;

		render(<ChangePasswordPage />);

		const changePasswordForm = screen.getByTestId('change-password-form');
		fireEvent.submit(changePasswordForm);

		await waitFor(() => {
			const passwordField = screen.getByTestId('password-field') as HTMLInputElement;
			const cnfPasswordField = screen.getByTestId(
				'cnfPassword-field',
			) as HTMLInputElement;

			expect(passwordField.defaultValue).toBe('');
			expect(cnfPasswordField.defaultValue).toBe('');

			expect(passwordField.value).toBe('');
			expect(cnfPasswordField.value).toBe('');
		});
	});
});
