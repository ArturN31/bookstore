import SignUpPage from '@/app/user/auth/signup/page';
import { SignUpAction, SignUpFormState } from '@/data/actions/auth/SignUpAction';
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
            password: 'ValidP@ss1!',
            cnfPassword: 'ValidP@ss1!',
            message: MOCK_MESSAGE,
            error: undefined,
            validationErrors: undefined,
        };
    });

    it('should show real-time validation issues when typing invalid data (excluding "required" errors)', async () => {
        render(<SignUpPage />);

        const emailField = screen.getByTestId('email-field');
        fireEvent.change(emailField, { target: { name: 'email', value: 'not-an-email' } });

        await waitFor(() => {
            const errorDisplay = screen.getByTestId('form-error-display');
            expect(errorDisplay).toBeInTheDocument();
            expect(errorDisplay).toHaveTextContent('Validation Issues');
        });
    });

    it('should set formError state and display message when server action returns an error', async () => {
        render(<SignUpPage />);

        const emailField = screen.getByTestId('email-field');
        const passwordField = screen.getByTestId('password-field');
        const cnfPasswordField = screen.getByTestId('cnfPassword-field');

        fireEvent.change(emailField, { target: { name: 'email', value: 'valid@gmail.com' } });
        fireEvent.change(passwordField, { target: { name: 'password', value: 'ValidP@ss1!' } });
        fireEvent.change(cnfPasswordField, {
            target: { name: 'cnfPassword', value: 'ValidP@ss1!' },
        });

        const signupForm = screen.getByTestId('signup-form');
        fireEvent.submit(signupForm);

        await waitFor(() => {
            expect(SignUpAction).toHaveBeenCalled();
            const errorDisplay = screen.getByTestId('form-error-display');
            expect(errorDisplay).toHaveTextContent(MOCK_MESSAGE);
        });
    });

    it('should reset the formState and clear values on resetBtn click', async () => {
        render(<SignUpPage />);

        const emailField = screen.getByTestId('email-field') as HTMLInputElement;
        const resetBtn = screen.getByTestId('reset-btn');

        fireEvent.change(emailField, { target: { name: 'email', value: 'dirty-state@test.com' } });
        expect(emailField.value).toBe('dirty-state@test.com');

        fireEvent.click(resetBtn);

        await waitFor(() => {
            expect(emailField.value).toBe('');
            expect(SignUpAction).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    get: expect.any(Function),
                }),
            );
        });
    });

    it('should prevent submission and show error if local validation fails', async () => {
        render(<SignUpPage />);

        const signupForm = screen.getByTestId('signup-form');

        fireEvent.submit(signupForm);

        await waitFor(() => {
            expect(SignUpAction).not.toHaveBeenCalled();
            const errorDisplay = screen.getByTestId('form-error-display');
            expect(errorDisplay).toHaveTextContent('Please fix the errors before submitting.');
        });
    });

    it('should fall back to empty string when state returns null', async () => {
        mockReturnState = {
            email: null,
            password: null,
            cnfPassword: null,
            message: 'Server Null Error',
            error: undefined,
            validationErrors: undefined,
        } as any;

        render(<SignUpPage />);

        const emailField = screen.getByTestId('email-field') as HTMLInputElement;

        fireEvent.change(emailField, { target: { name: 'email', value: 'valid@test.com' } });
        fireEvent.change(screen.getByTestId('password-field'), {
            target: { name: 'password', value: 'ValidP@ss1!' },
        });
        fireEvent.change(screen.getByTestId('cnfPassword-field'), {
            target: { name: 'cnfPassword', value: 'ValidP@ss1!' },
        });

        fireEvent.submit(screen.getByTestId('signup-form'));

        await waitFor(() => {
            expect(emailField.value).toBe('');
        });
    });
});
