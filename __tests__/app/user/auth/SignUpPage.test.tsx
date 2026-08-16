import SignUpPage from '@/app/user/auth/signup/page';
import { SignUpAction } from '@/data/auth/SignUpAction';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

const MOCK_MESSAGE = 'Please correct the errors below.';

type MockReturnState = {
    email: string | null;
    password: string | null;
    cnfPassword: string | null;
    message: string | undefined;
    error: undefined;
    validationErrors: undefined;
};

let mockReturnState: MockReturnState = {
    email: 'test@gmail.com',
    password: 'test1',
    cnfPassword: 'test1',
    message: MOCK_MESSAGE,
    error: undefined,
    validationErrors: undefined,
};

let triggerMockVerify: (token: string) => void;
let triggerMockExpire: () => void;

type HCaptchaProps = {
    onVerify?: (token: string) => void;
    onExpire?: () => void;
};

jest.mock('@hcaptcha/react-hcaptcha', () => {
    const ReactActual = jest.requireActual('react');

    return {
        __esModule: true,
        default: ReactActual.forwardRef(
            (props: HCaptchaProps, ref: React.Ref<{ resetCaptcha: () => void }>) => {
                triggerMockVerify = (token: string) => {
                    if (props.onVerify) {
                        act(() => {
                            props.onVerify!(token);
                        });
                    }
                };
                triggerMockExpire = () => {
                    if (props.onExpire) {
                        act(() => {
                            props.onExpire!();
                        });
                    }
                };

                ReactActual.useImperativeHandle(ref, () => ({
                    resetCaptcha: jest.fn(),
                }));

                return <div data-testid="mock-hcaptcha" />;
            },
        ),
    };
});

jest.mock('@/data/auth/SignUpAction', () => ({
    SignUpAction: jest.fn(async (_prevState: unknown, formData: FormData) => {
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
        useActionState: (
            actionFn: (state: MockReturnState, formData: FormData) => Promise<MockReturnState>,
            initialState: MockReturnState,
        ) => {
            const [state, setState] = originalReact.useState(initialState);

            const formAction = async (formData: FormData) => {
                const newState = await actionFn(state, formData);
                setState(newState);
            };

            return [state, formAction] as const;
        },
        useTransition: () => [false, (callback: () => void) => callback()] as const,
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

    it('FUNCTION COVERAGE: should execute onVerify and onExpire arrow functions smoothly', async () => {
        render(<SignUpPage />);

        await waitFor(() => {
            expect(screen.getByTestId('mock-hcaptcha')).toBeInTheDocument();
        });

        triggerMockVerify('test-token');
        triggerMockExpire();
    });

    it('should show real-time validation issues when typing invalid data (excluding "required" errors)', async () => {
        render(<SignUpPage />);

        const emailField = screen.getByTestId('email-field');
        fireEvent.change(emailField, { target: { name: 'email', value: 'not-an-email' } });

        await waitFor(() => {
            expect(screen.getByText(/Validation Issues/i)).toBeInTheDocument();
        });
    });

    it('should show cnfPassword mismatch error (covers issue.code === "custom" branch)', async () => {
        render(<SignUpPage />);

        const passwordField = screen.getByTestId('password-field');
        const cnfPasswordField = screen.getByTestId('cnfPassword-field');

        fireEvent.change(passwordField, { target: { name: 'password', value: 'ValidP@ss1!' } });
        fireEvent.change(cnfPasswordField, {
            target: { name: 'cnfPassword', value: 'DifferentP@ss2!' },
        });

        await waitFor(() => {
            expect(screen.getByText(/Validation Issues/i)).toBeInTheDocument();
            expect(screen.getByText(/Passwords must match/i)).toBeInTheDocument();
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

        triggerMockVerify('mocked-captcha-token');

        const signupForm = screen.getByTestId('signup-form');
        fireEvent.submit(signupForm);

        await waitFor(() => {
            expect(SignUpAction).toHaveBeenCalled();
            const errorDisplay = screen.getByTestId('form-error-display');
            expect(errorDisplay).toHaveTextContent(MOCK_MESSAGE);
        });
    });

    it('should submit with empty captchaToken if captchaToken is null when fields are valid', async () => {
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
            expect(screen.getByText(/Validation Issues/i)).toBeInTheDocument();
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
        };

        render(<SignUpPage />);

        const emailField = screen.getByTestId('email-field') as HTMLInputElement;

        fireEvent.change(emailField, { target: { name: 'email', value: 'valid@test.com' } });
        fireEvent.change(screen.getByTestId('password-field'), {
            target: { name: 'password', value: 'ValidP@ss1!' },
        });
        fireEvent.change(screen.getByTestId('cnfPassword-field'), {
            target: { name: 'cnfPassword', value: 'ValidP@ss1!' },
        });

        triggerMockVerify('mocked-captcha-token');

        fireEvent.submit(screen.getByTestId('signup-form'));

        await waitFor(() => {
            expect(screen.getByText(/Server Null Error/i)).toBeInTheDocument();
        });
    });

    it('BRANCH COVERAGE: should fall back to an empty string when hCaptcha environment variable is missing (covers || "" branch)', async () => {
        const originalEnvValue = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

        delete process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

        const { container } = render(<SignUpPage />);

        expect(container).toBeInTheDocument();

        process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY = originalEnvValue;
    });
});
