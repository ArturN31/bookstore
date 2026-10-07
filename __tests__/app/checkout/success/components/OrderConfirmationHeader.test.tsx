import { OrderConfirmationHeader } from '@/app/checkout/success/components/OrderConfirmationHeader';
import { render, screen } from '@testing-library/react';

describe('OrderConfirmationHeader', () => {
    it('renders header text, description, and order ID badge', () => {
        render(<OrderConfirmationHeader orderId="ORD-998877" />);

        expect(screen.getByText('Order Confirmed Successfully')).toBeInTheDocument();
        expect(
            screen.getByText(
                "We've received your payment and are getting your books ready for dispatch.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('Order ID')).toBeInTheDocument();
        expect(screen.getByText('ORD-998877')).toBeInTheDocument();
    });
});
