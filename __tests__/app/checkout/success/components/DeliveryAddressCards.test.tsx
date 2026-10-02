import { DeliveryAddressCard } from '@/app/checkout/success/components/DeliveryAddressCard';
import { render, screen } from '@testing-library/react';

describe('DeliveryAddressCard', () => {
    it('renders recipient name and provided address lines', () => {
        render(
            <DeliveryAddressCard
                recipientName="John Doe"
                addressLines={['123 High St', 'London, SW1A 1AA', 'United Kingdom']}
            />,
        );

        expect(screen.getByText('Delivery Address')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('123 High St')).toBeInTheDocument();
        expect(screen.getByText('London, SW1A 1AA')).toBeInTheDocument();
        expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    });

    it('renders fallback text when addressLines array is empty', () => {
        render(
            <DeliveryAddressCard
                recipientName="Jane Smith"
                addressLines={[]}
            />,
        );

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Shipping details registered securely')).toBeInTheDocument();
    });
});
