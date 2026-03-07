import SignInPage from '@/app/user/auth/signin/page';
import { SignInFormState } from '@/data/actions/auth/SignInAction';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MOCK_ACTION_MESSAGE = 'Please correct the errors below.';
const CLIENT_VALIDATION_MESSAGE = 'Please fix the errors before submitting.';

let mockReturnState: SignInFormState = {
    email: 'test@gmail.com',
    password: 'test1',
    message: MOCK_ACTION_MESSAGE,
    error: undefined,
    validationErrors: undefined,
};

const mockGetParam = jest.fn();
jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: mockGetParam,
    }),
}));

jest.mock('@/data/actions/auth/SignInAction', () => ({
    SignInAction: jest.fn(async (prevState, formData) => {
        const reset = formData.get('reset');
        if (reset === 'yes') {
            return {
                email: '',
                password: '',
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

describe('APP - Auth - SignIn', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetParam.mockReturnValue(null);
    });

    it('should show client-side validation message when Zod fails during submit', async () => {
        render(<SignInPage />);

        const signinForm = screen.getByTestId('signin-form');
        fireEvent.submit(signinForm);

        await waitFor(() => {
            const errorDisplay = screen.getByTestId('form-error-display');
            expect(errorDisplay).toHaveTextContent(CLIENT_VALIDATION_MESSAGE);
        });
    });

    it('should show server-side message when client validation passes but auth fails', async () => {
        mockReturnState = {
            ...mockReturnState,
            message: 'Invalid Credentials',
        };

        render(<SignInPage />);

        const emailField = screen.getByTestId('email-field');
        const passwordField = screen.getByTestId('password-field');

        fireEvent.change(emailField, { target: { value: 'test@gmail.com', name: 'email' } });
        fireEvent.change(passwordField, { target: { value: 'ValidP@ss123', name: 'password' } });

        const signinForm = screen.getByTestId('signin-form');
        fireEvent.submit(signinForm);

        await waitFor(() => {
            const errorDisplay = screen.getByTestId('form-error-display');
            expect(errorDisplay).toHaveTextContent('Invalid Credentials');
        });
    });

    it('should reset the formData state on handleReset', async () => {
        render(<SignInPage />);

        const emailField = screen.getByTestId('email-field') as HTMLInputElement;
        fireEvent.change(emailField, { target: { value: 'dirty@data.com', name: 'email' } });

        const resetBtn = screen.getByTestId('reset-btn');
        fireEvent.click(resetBtn);

        await waitFor(() => {
            expect(emailField.value).toBe('');
        });
    });

    it('should handle returnTo hidden input from search params', () => {
        mockGetParam.mockReturnValue('/wishlist');

        render(<SignInPage />);

        const hiddenInput = document.querySelector('input[name="returnTo"]') as HTMLInputElement;

        expect(hiddenInput).not.toBeNull();
        expect(hiddenInput?.value).toBe('/wishlist');
    });

    it('should ignore errors belonging to other fields (isCurrentField logic)', async () => {
        render(<SignInPage />);
        const passwordField = screen.getByTestId('password-field');

        fireEvent.change(passwordField, { target: { name: 'password', value: 'short' } });

        await waitFor(() => {
            const validationList = screen.queryByRole('list');
            if (validationList) {
                expect(validationList).not.toHaveTextContent(/email/i);
            }
        });
    });

    it('should set message to "Validation Issues" when format errors exist', async () => {
        render(<SignInPage />);
        const emailField = screen.getByTestId('email-field');

        fireEvent.change(emailField, { target: { name: 'email', value: 'not-an-email' } });

        await waitFor(() => {
            expect(screen.getByText('Validation Issues')).toBeInTheDocument();
        });
    });

    it('should append returnTo when present in URL', async () => {
        const { SignInAction } = require('@/data/actions/auth/SignInAction');

        mockGetParam.mockReturnValue('/profile');

        render(<SignInPage />);

        fireEvent.change(screen.getByTestId('email-field'), {
            target: { name: 'email', value: 'a@b.com' },
        });
        fireEvent.change(screen.getByTestId('password-field'), {
            target: { name: 'password', value: 'ValidPass123' },
        });

        fireEvent.submit(screen.getByTestId('signin-form'));

        await waitFor(() => {
            const sentData = (SignInAction as jest.Mock).mock.calls[0][1];
            expect(sentData.get('returnTo')).toBe('/profile');
        });
    });

    it('should handle null/undefined values in formData and construction', async () => {
        mockReturnState = {
            ...mockReturnState,
            email: null,
            password: null,
            message: 'Partial data',
        };

        render(<SignInPage />);

        const emailField = screen.getByTestId('email-field') as HTMLInputElement;
        const passwordField = screen.getByTestId('password-field') as HTMLInputElement;

        expect(emailField.value).toBe('');
        expect(passwordField.value).toBe('');

        fireEvent.change(emailField, { target: { value: 'test@test.com', name: 'email' } });
        fireEvent.change(passwordField, { target: { value: 'ValidP@ss123', name: 'password' } });

        fireEvent.submit(screen.getByTestId('signin-form'));

        await waitFor(() => {
            expect(screen.getByTestId('form-error-display')).toBeInTheDocument();
        });
    });
});
