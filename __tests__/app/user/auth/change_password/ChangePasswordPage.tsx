import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChangePasswordPage from '@/app/user/auth/change_password/page';
import { ChangePasswordAction } from '@/data/actions/auth/ChangePasswordAction';

jest.mock('@/data/actions/auth/ChangePasswordAction', () => ({
    ChangePasswordAction: jest.fn(),
}));

describe('ChangePasswordPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ChangePasswordAction as jest.Mock).mockImplementation(async (prevState: any, formData: FormData) => {
            return { message: null, validationErrors: [] };
        });
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
        
        // Enter weak password that fails validation
        fireEvent.change(passwordInput, { target: { value: 'weak' } });
        fireEvent.change(confirmInput, { target: { value: 'weak' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        // Give time for any async operations
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Form action should not be called because client validation fails
        expect(ChangePasswordAction).not.toHaveBeenCalled();
    });

    it('should show loading state when pending', async () => {
        (ChangePasswordAction as jest.Mock).mockImplementation(async (prevState: any, formData: FormData) => {
            return new Promise(resolve => setTimeout(() => resolve({ message: null, validationErrors: [] }), 100));
        });

        render(<ChangePasswordPage />);

        const passwordInput = screen.getByLabelText('New Password');
        const confirmInput = screen.getByLabelText('Confirm New Password');
        
        fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
        fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        // Button should be disabled during pending state
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
});
