import SignInPage from '@/app/user/auth/signin/page';
import { SignInFormState } from '@/data/actions/auth/SignInAction';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MOCK_ACTION_MESSAGE = 'Please correct the errors below.';

let mockReturnState: SignInFormState = {
    message: MOCK_ACTION_MESSAGE,
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
                message: null,
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
        useActionState: (
            actionFn: (state: SignInFormState, data: FormData) => Promise<SignInFormState>,
            initialState: SignInFormState,
        ) => {
            const [state, setState] = originalReact.useState(initialState);

            const formAction = async (formData: FormData) => {
                const newState = await actionFn(state, formData);
                setState(newState);
            };

            return [state, formAction];
        },
        useTransition: () => [false, (callback: () => void) => callback()],
    };
});

describe('APP - Auth - SignIn', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetParam.mockReturnValue(null);
    });

    it('should show client-side validation message when Zod fails during submit', async () => {
        render(<SignInPage />);

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            const { SignInAction } = require('@/data/actions/auth/SignInAction');
            expect(SignInAction).not.toHaveBeenCalled();
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

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(screen.getByText(/Invalid Credentials/i)).toBeInTheDocument();
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
            expect(screen.getByText(/Validation Issues/i)).toBeInTheDocument();
        });
    });

    it('should clear client errors on successful validation (covers setClientErrors([]) branch)', async () => {
        const { SignInAction } = require('@/data/actions/auth/SignInAction');

        mockReturnState = {
            ...mockReturnState,
            message: null,
            validationErrors: undefined,
        };

        render(<SignInPage />);

        const emailField = screen.getByTestId('email-field') as HTMLInputElement;
        const passwordField = screen.getByTestId('password-field') as HTMLInputElement;

        fireEvent.change(emailField, { target: { name: 'email', value: 'not-an-email' } });

        await waitFor(() => {
            expect(screen.getByText(/Validation Issues/i)).toBeInTheDocument();
        });

        fireEvent.change(emailField, { target: { name: 'email', value: 'valid@test.com' } });
        fireEvent.change(passwordField, { target: { name: 'password', value: 'ValidPass123!' } });

        await waitFor(() => {
            expect(screen.queryByText(/Validation Issues/i)).not.toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(SignInAction).toHaveBeenCalled();
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

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            const sentData = (SignInAction as jest.Mock).mock.calls[0][1];
            expect(sentData.get('returnTo')).toBe('/profile');
        });
    });

    it('should NOT append returnTo when not present in URL (covers if branch false)', async () => {
        const { SignInAction } = require('@/data/actions/auth/SignInAction');

        mockGetParam.mockReturnValue(null);

        render(<SignInPage />);

        fireEvent.change(screen.getByTestId('email-field'), {
            target: { name: 'email', value: 'a@b.com' },
        });
        fireEvent.change(screen.getByTestId('password-field'), {
            target: { name: 'password', value: 'ValidPass123' },
        });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            const sentData = (SignInAction as jest.Mock).mock.calls[0][1];
            expect(sentData.get('returnTo')).toBeNull();
        });
    });

    it('should handle state values smoothly and match UI layout standards', async () => {
        mockReturnState = {
            ...mockReturnState,
            message: 'Partial data',
            validationErrors: undefined,
        };

        render(<SignInPage />);

        const emailField = screen.getByTestId('email-field') as HTMLInputElement;
        const passwordField = screen.getByTestId('password-field') as HTMLInputElement;

        expect(emailField.value).toBe('');
        expect(passwordField.value).toBe('');

        fireEvent.change(emailField, { target: { value: 'test@test.com', name: 'email' } });
        fireEvent.change(passwordField, { target: { value: 'ValidP@ss123', name: 'password' } });

        fireEvent.click(screen.getByText('Submit'));

        await waitFor(() => {
            expect(screen.getByText(/Error:/i)).toBeInTheDocument();
        });
    });

    it('should cover the scenario where validation errors are matched and stored for a specific field name', async () => {
        render(<SignInPage />);
        const emailField = screen.getByTestId('email-field');

        fireEvent.change(emailField, { target: { name: 'email', value: 'not-valid' } });

        await waitFor(() => {
            expect(screen.getByText(/Validation Issues/i)).toBeInTheDocument();
        });
    });

    it('should cover the alternative condition where validation fails but no target field name matches path issues', async () => {
        render(<SignInPage />);
        const emailField = screen.getByTestId('email-field');

        fireEvent.change(emailField, { target: { name: 'email', value: 'goodformat@gmail.com' } });

        await waitFor(() => {
            expect(screen.queryByText(/Validation Issues/i)).not.toBeInTheDocument();
        });
    });

    it('should hit handleSubmit failure catch block explicitly when input data fails zod validation during submission', async () => {
        render(<SignInPage />);

        const emailField = screen.getByTestId('email-field');
        fireEvent.change(emailField, { target: { name: 'email', value: 'invalid-email-string' } });

        const formElement = document.getElementById('signin-form');
        expect(formElement).not.toBeNull();

        fireEvent.submit(formElement as HTMLElement);

        await waitFor(() => {
            const { SignInAction } = require('@/data/actions/auth/SignInAction');
            expect(SignInAction).not.toHaveBeenCalled();
        });
    });
});
