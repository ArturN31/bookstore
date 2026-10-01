import { PaymentMethodSection } from '@/app/checkout/components/PaymentMethodSection';
import { render, screen } from '@testing-library/react';
import { useStripe } from '@stripe/react-stripe-js';
import { SANDBOX_BANNER_MESSAGE } from '@/data/checkout/CheckoutConstants';
import { JSX } from 'react';

jest.mock('@stripe/react-stripe-js', () => ({
    useStripe: jest.fn(),
    useElements: jest.fn(() => ({})),
    CardElement: (): JSX.Element => <div data-testid="mock-card-element" />,
}));

describe('PaymentMethodSection', () => {
    const originalEnv = process.env;
    const mockUseStripe = jest.mocked(useStripe);

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_12345' };
        mockUseStripe.mockReturnValue({} as unknown as ReturnType<typeof useStripe>);
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('renders header, sandbox alert banner, badges, and CardElement when key and stripe are valid', () => {
        render(<PaymentMethodSection />);

        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText(SANDBOX_BANNER_MESSAGE)).toBeInTheDocument();
        expect(screen.getByText('Credit / Debit Card (Stripe Secure)')).toBeInTheDocument();
        expect(screen.getByText('VISA')).toBeInTheDocument();
        expect(screen.getByText('MC')).toBeInTheDocument();
        expect(screen.getByText('AMEX')).toBeInTheDocument();
        expect(screen.getByTestId('mock-card-element')).toBeInTheDocument();

        expect(
            screen.queryByText(/Stripe publishable key .* is missing or invalid/i),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText('Initializing Stripe payment gateway...'),
        ).not.toBeInTheDocument();
    });

    it('renders error alert when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing', () => {
        delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        render(<PaymentMethodSection />);

        expect(
            screen.getByText(
                'Stripe publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) is missing or invalid in `.env.local`.',
            ),
        ).toBeInTheDocument();
    });

    it('renders error alert when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY does not start with pk_', () => {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'invalid_secret_key';

        render(<PaymentMethodSection />);

        expect(
            screen.getByText(
                'Stripe publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) is missing or invalid in `.env.local`.',
            ),
        ).toBeInTheDocument();
    });

    it('renders warning alert when stripe gateway is initializing (stripe is null)', () => {
        mockUseStripe.mockReturnValueOnce(null);

        render(<PaymentMethodSection />);

        expect(screen.getByText('Initializing Stripe payment gateway...')).toBeInTheDocument();
        expect(
            screen.queryByText(/Stripe publishable key .* is missing or invalid/i),
        ).not.toBeInTheDocument();
    });
});
