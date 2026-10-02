import { render, screen } from '@testing-library/react';
import { OrderStatusCard } from '@/app/checkout/success/components/OrderStatusCard';

describe('OrderStatusCard', () => {
    it('renders payment status and fulfillment state badges correctly', () => {
        render(
            <OrderStatusCard
                paymentStatus="PAID"
                fulfillmentStatus="PROCESSING"
            />,
        );

        expect(screen.getByText('Status & Verification')).toBeInTheDocument();
        expect(screen.getByText('Payment Status')).toBeInTheDocument();
        expect(screen.getByText('PAID')).toBeInTheDocument();
        expect(screen.getByText('Fulfillment State')).toBeInTheDocument();
        expect(screen.getByText('PROCESSING')).toBeInTheDocument();
    });
});
