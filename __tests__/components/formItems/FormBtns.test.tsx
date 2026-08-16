import { FormBtns } from '@/components/formItems/FormBtns';
import { render, screen } from '@testing-library/react';

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn().mockResolvedValue(undefined),
}));

const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(
        (message: unknown, ...optionalParams: unknown[]) => {
            if (
                typeof message === 'string' &&
                (message.includes('[SecurityAudit]') || message.includes('recordSecurityAuditLog'))
            ) {
                return;
            }
            originalWarn(message, ...optionalParams);
        },
    );

    jest.spyOn(console, 'error').mockImplementation(
        (message: unknown, ...optionalParams: unknown[]) => {
            if (typeof message === 'string' && message.includes('[UserAddressAction]')) {
                return;
            }
            originalError(message, ...optionalParams);
        },
    );
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('APP - FormItems - FormBtns', () => {
    const mockHandleReset = jest.fn();

    const defaultProps = {
        isTransitioningSubmit: false,
        isTransitioningReset: false,
        handleReset: mockHandleReset,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show "Submit" and be enabled by default', () => {
        render(<FormBtns {...defaultProps} />);
        const submitBtn = screen.getByRole('button', { name: /submit/i });

        expect(submitBtn).toBeInTheDocument();
        expect(submitBtn).toBeEnabled();
    });

    it('should show "Submitting..." and be disabled when isTransitioningSubmit is true', () => {
        render(
            <FormBtns
                {...defaultProps}
                isTransitioningSubmit={true}
            />,
        );
        const submitBtn = screen.getByRole('button', { name: /submitting.../i });

        expect(submitBtn).toBeDisabled();
    });

    it('should show "Clear" and be enabled by default', () => {
        render(<FormBtns {...defaultProps} />);
        const resetBtn = screen.getByTestId('reset-btn');

        expect(resetBtn).toHaveTextContent('Clear');
        expect(resetBtn).toBeEnabled();
    });

    it('should show "Clearing..." and be disabled when isTransitioningReset is true', () => {
        render(
            <FormBtns
                {...defaultProps}
                isTransitioningReset={true}
            />,
        );
        const resetBtn = screen.getByTestId('reset-btn');

        expect(resetBtn).toHaveTextContent('Clearing...');
        expect(resetBtn).toBeDisabled();
    });
});
