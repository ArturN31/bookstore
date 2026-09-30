import { PaymentMethodSection } from '@/app/checkout/components/PaymentMethodSection';
import { render, screen } from '@testing-library/react';
import { SANDBOX_BANNER_MESSAGE } from '@/data/checkout/CheckoutConstants';
import { JSX } from 'react';

jest.mock('@stripe/react-stripe-js', () => ({
    useStripe: jest.fn(() => ({})),
    useElements: jest.fn(() => ({})),
    CardElement: (): JSX.Element => <div data-testid="mock-card-element" />,
}));

describe('PaymentMethodSection', () => {
    it('renders header, sandbox alert banner, and accepted payment cards', () => {
        render(<PaymentMethodSection />);

        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText(SANDBOX_BANNER_MESSAGE)).toBeInTheDocument();
        expect(screen.getByText('Credit / Debit Card (Stripe Secure)')).toBeInTheDocument();
        expect(screen.getByText('VISA')).toBeInTheDocument();
        expect(screen.getByText('MC')).toBeInTheDocument();
        expect(screen.getByText('AMEX')).toBeInTheDocument();
    });
});
