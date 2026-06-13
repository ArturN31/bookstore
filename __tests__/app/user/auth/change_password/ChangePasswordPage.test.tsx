import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChangePasswordPage from '@/app/user/auth/change_password/page';
import { ChangePasswordAction } from '@/data/actions/auth/ChangePasswordAction';

interface ValidationErrorObject {
    message: string;
}

interface MockFormState {
    message: string | null;
    validationErrors: ValidationErrorObject[];
}

jest.mock('@/data/actions/auth/ChangePasswordAction', () => ({
    ChangePasswordAction: jest.fn(),
}));

let mockIsPending = false;

jest.mock('react', () => {
    const actualReact = jest.requireActual('react');
    return {
        ...actualReact,
        useActionState: jest.fn((action, initialState) => {
            const boundAction = (payload: FormData) => action(initialState, payload);
            return [initialState, boundAction];
        }),
        useTransition: jest.fn(() => [mockIsPending, (callback: () => void) => callback()]),
    };
});

describe('ChangePasswordPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsPending = false;

        (ChangePasswordAction as jest.Mock).mockImplementation(async () => {
            return { message: null, validationErrors: [] };
        });

        (require('react').useActionState as jest.Mock).mockImplementation(
            (action, initialState) => {
                const boundAction = (payload: FormData) => action(initialState, payload);
                return [initialState, boundAction];
            },
        );
    });

    it('should render the change password form', () => {
        render(<ChangePasswordPage />);

        expect(screen.getByText('Update Your Password')).toBeInTheDocument();
        expect(screen.getByText('Ensure your account remains secure.')).toBeInTheDocument();
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should handle form submission with valid data', async () => {
        render(<ChangePasswordPage />);

        const passwordInput = screen.getByLabelText('New Password');
        const confirmInput = screen.getByLabelText('Confirm New Password');

        fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
        fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => {
            expect(ChangePasswordAction).toHaveBeenCalled();
        });
    });

    it('should prevent submission when validation fails', async () => {
        render(<ChangePasswordPage />);

        const passwordInput = screen.getByLabelText('New Password');
        const confirmInput = screen.getByLabelText('Confirm New Password');

        fireEvent.change(passwordInput, { target: { value: 'weak' } });
        fireEvent.change(confirmInput, { target: { value: 'weak' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
        });

        expect(ChangePasswordAction).not.toHaveBeenCalled();
    });

    it('should show loading state when pending', async () => {
        mockIsPending = true;

        render(<ChangePasswordPage />);

        const submitButton = screen.getByRole('button', { name: /submit/i });
        expect(submitButton).toBeDisabled();
    });

    it('should call formAction with FormData on submit', async () => {
        render(<ChangePasswordPage />);

        const passwordInput = screen.getByLabelText('New Password');
        const confirmInput = screen.getByLabelText('Confirm New Password');

        fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
        fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => {
            expect(ChangePasswordAction).toHaveBeenCalled();
        });

        const callArgs = (ChangePasswordAction as jest.Mock).mock.calls[0];
        expect(callArgs[1]).toBeInstanceOf(FormData);
    });

    it('should handle reset button click', async () => {
        render(<ChangePasswordPage />);

        const passwordInput = screen.getByLabelText('New Password');
        const confirmInput = screen.getByLabelText('Confirm New Password');

        fireEvent.change(passwordInput, { target: { value: 'SomePass123!' } });
        fireEvent.change(confirmInput, { target: { value: 'SomePass123!' } });

        fireEvent.click(screen.getByRole('button', { name: /clear/i }));

        await waitFor(() => {
            expect(ChangePasswordAction).toHaveBeenCalled();
        });
    });

    it('should render form validation errors when present (covers lines 26 & 74 true branches)', () => {
        const stateWithValidationErrors: MockFormState = {
            message: 'Invalid registration parameters supplied.',
            validationErrors: [
                { message: 'Password must be at least 8 characters long.' },
                { message: 'Passwords do not match.' },
            ],
        };

        (require('react').useActionState as jest.Mock).mockImplementation(
            (action, initialState) => {
                const boundAction = (payload: FormData) =>
                    action(stateWithValidationErrors, payload);
                return [stateWithValidationErrors, boundAction];
            },
        );

        render(<ChangePasswordPage />);

        expect(screen.getByText('Invalid registration parameters supplied.')).toBeInTheDocument();
        expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should render cleanly when validationErrors list is undefined (covers lines 26 & 74 false branches)', () => {
        const stateWithoutValidationErrors = {
            message: 'Unexpected validation breakdown.',
            validationErrors: undefined,
        };

        (require('react').useActionState as jest.Mock).mockImplementation(
            (action, initialState) => {
                const boundAction = (payload: FormData) =>
                    action(stateWithoutValidationErrors, payload);
                return [stateWithoutValidationErrors, boundAction];
            },
        );

        render(<ChangePasswordPage />);

        expect(screen.getByText('Unexpected validation breakdown.')).toBeInTheDocument();
    });
});
