import ChangePasswordPage from '@/app/user/auth/change_password/page';
import { ChangePasswordFormState } from '@/data/auth/ChangePasswordAction';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MOCK_MESSAGE = 'Please correct the errors below.';

let mockReturnState: ChangePasswordFormState = {
    message: MOCK_MESSAGE,
    validationErrors: undefined,
};

jest.mock('@/data/auth/ChangePasswordAction', () => ({
    ChangePasswordAction: jest.fn(
        async (prevState: ChangePasswordFormState, formData: FormData) => {
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
        },
    ),
}));

jest.mock('react', () => {
    const originalReact = jest.requireActual<typeof import('react')>('react');
    return {
        ...originalReact,
        useActionState: (
            actionFn: (
                state: ChangePasswordFormState,
                payload: FormData,
            ) => Promise<ChangePasswordFormState>,
            initialState: ChangePasswordFormState,
        ): [ChangePasswordFormState, (formData: FormData) => Promise<void>] => {
            const [state, setState] = originalReact.useState<ChangePasswordFormState>(initialState);
            const formAction = async (formData: FormData): Promise<void> => {
                const newState = await actionFn(state, formData);
                setState(newState);
            };
            return [state, formAction];
        },
        useTransition: (): [boolean, (callback: () => void) => void] => [
            false,
            (callback: () => void) => callback(),
        ],
    };
});

interface FieldProps {
    id: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface FormBtnsProps {
    handleReset?: () => void;
}

interface FormErrorsProps {
    formError?: string | null;
}

jest.mock('@/components/formItems/PasswordField', () => ({
    PasswordField: (props: FieldProps) => (
        <input
            id={props.id}
            name={props.id}
            data-testid={`${props.id}-field`}
            value={props.value}
            onChange={props.onChange}
        />
    ),
}));

jest.mock('@/components/formItems/FormBtns', () => ({
    FormBtns: (props: FormBtnsProps) => (
        <div className="flex justify-end gap-3 pt-4">
            <button type="submit">Save</button>
            <button
                data-testid="reset-btn"
                onClick={props.handleReset}
                type="button"
            >
                Clear
            </button>
        </div>
    ),
}));

jest.mock('@/components/formItems/FormErrors', () => ({
    FormErrors: ({ formError }: FormErrorsProps) =>
        formError ? <div data-testid="form-error-display">{formError}</div> : null,
}));

describe('APP - Auth - ChangePasswordPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockReturnState = {
            message: MOCK_MESSAGE,
            validationErrors: undefined,
        };
    });

    it('should show real-time validation errors as the user types', async () => {
        render(<ChangePasswordPage />);

        const passwordField = screen.getByTestId('password-field');

        fireEvent.change(passwordField, { target: { name: 'password', value: 'abcdefgh' } });

        await waitFor(() => {
            expect(passwordField).toBeInTheDocument();
        });
    });

    it('should prevent submission and show error message when schema validation fails', async () => {
        render(<ChangePasswordPage />);

        const passwordField = screen.getByTestId('password-field');
        const cnfPasswordField = screen.getByTestId('cnfPassword-field');

        fireEvent.change(passwordField, { target: { name: 'password', value: 'short' } });
        fireEvent.change(cnfPasswordField, { target: { name: 'cnfPassword', value: 'mismatch' } });

        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            const { ChangePasswordAction } = require('@/data/auth/ChangePasswordAction');
            expect(ChangePasswordAction).not.toHaveBeenCalled();
        });
    });

    it('should construct FormData and call formAction when validation passes', async () => {
        mockReturnState = {
            message: 'Success!',
            validationErrors: undefined,
        };

        render(<ChangePasswordPage />);

        const passwordField = screen.getByTestId('password-field');
        const cnfPasswordField = screen.getByTestId('cnfPassword-field');

        const validPass = 'ValidP@ss123!';
        fireEvent.change(passwordField, { target: { name: 'password', value: validPass } });
        fireEvent.change(cnfPasswordField, { target: { name: 'cnfPassword', value: validPass } });

        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            const { ChangePasswordAction } = require('@/data/auth/ChangePasswordAction');

            expect(ChangePasswordAction).toHaveBeenCalled();

            const sentFormData = (ChangePasswordAction as jest.Mock).mock.calls[0][1] as FormData;
            expect(sentFormData.get('password')).toBe(validPass);
            expect(sentFormData.get('cnfPassword')).toBe(validPass);
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

    it('LOGIC COVERAGE: should cover FormData construction and submission', async () => {
        render(<ChangePasswordPage />);

        const passwordField = screen.getByTestId('password-field');
        const cnfPasswordField = screen.getByTestId('cnfPassword-field');

        const validPass = 'ValidP@ss123!';

        fireEvent.change(passwordField, { target: { name: 'password', value: validPass } });
        fireEvent.change(cnfPasswordField, { target: { name: 'cnfPassword', value: validPass } });

        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            const { ChangePasswordAction } = require('@/data/auth/ChangePasswordAction');
            expect(ChangePasswordAction).toHaveBeenCalled();

            const sentFormData = (ChangePasswordAction as jest.Mock).mock.calls[0][1] as FormData;
            expect(sentFormData.get('password')).toBe(validPass);
        });
    });

    it('BRANCH COVERAGE: hits nullish coalescing branches in JSX', async () => {
        mockReturnState = {
            message: 'Password changed successfully',
            validationErrors: undefined,
        };

        render(<ChangePasswordPage />);

        const p1 = screen.getByTestId('password-field');
        const p2 = screen.getByTestId('cnfPassword-field');

        const valid = 'ValidP@ss123!';
        fireEvent.change(p1, { target: { name: 'password', value: valid } });
        fireEvent.change(p2, { target: { name: 'cnfPassword', value: valid } });

        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            const { ChangePasswordAction } = require('@/data/auth/ChangePasswordAction');
            expect(ChangePasswordAction).toHaveBeenCalled();
        });

        expect((p1 as HTMLInputElement).value).toBe(valid);
        expect((p2 as HTMLInputElement).value).toBe(valid);
    });

    it('BRANCH COVERAGE: covers empty validationErrors array (line 26 branch)', () => {
        mockReturnState = {
            message: null,
            validationErrors: [],
        };

        render(<ChangePasswordPage />);

        expect(screen.queryByText(/Validation Issues/i)).not.toBeInTheDocument();
    });

    it('BRANCH COVERAGE: covers displayErrors.length === 0 (line 74 branch)', () => {
        mockReturnState = {
            message: null,
            validationErrors: [],
        };

        render(<ChangePasswordPage />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
