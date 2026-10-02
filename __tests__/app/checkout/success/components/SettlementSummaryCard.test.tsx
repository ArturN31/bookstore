import { render, screen } from '@testing-library/react';
import { SettlementSummaryCard } from '@/app/checkout/success/components/SettlementSummaryCard';
import { OrderTotals } from '@/app/checkout/success/OrderConfirmationTypes';

describe('SettlementSummaryCard', () => {
    const mockTotalsWithDiscounts: OrderTotals = {
        subtotal: 50.0,
        discountTotal: 10.0,
        shippingCost: 4.99,
        grandTotal: 44.99,
        totalItemCount: 2,
        evaluatedDiscounts: [
            {
                id: 'disc-1',
                code: 'SAVE10',
                amount: 10.0,
            },
        ],
    };

    it('renders subtotal, evaluated discounts, shipping, grand total, and catalog navigation link', () => {
        render(<SettlementSummaryCard totals={mockTotalsWithDiscounts} />);

        expect(screen.getByText('Settlement Summary')).toBeInTheDocument();
        expect(screen.getByText('Original Subtotal')).toBeInTheDocument();
        expect(screen.getByText('£50.00')).toBeInTheDocument();

        expect(screen.getByText('Discount Applied')).toBeInTheDocument();
        expect(screen.getByText('SAVE10')).toBeInTheDocument();
        expect(screen.getByText('-£10.00')).toBeInTheDocument();

        expect(screen.getByText('Shipping & Handling')).toBeInTheDocument();
        expect(screen.getByText('£4.99')).toBeInTheDocument();

        expect(screen.getByText('Grand Total Paid')).toBeInTheDocument();
        expect(screen.getByText('£44.99')).toBeInTheDocument();

        const continueLink = screen.getByRole('link', { name: /continue shopping/i });
        expect(continueLink).toBeInTheDocument();
        expect(continueLink).toHaveAttribute('href', '/catalog');
    });

    it('renders correctly when no discounts are applied', () => {
        const mockTotalsNoDiscount: OrderTotals = {
            subtotal: 30.0,
            discountTotal: 0,
            shippingCost: 4.99,
            grandTotal: 34.99,
            totalItemCount: 1,
            evaluatedDiscounts: [],
        };

        render(<SettlementSummaryCard totals={mockTotalsNoDiscount} />);

        expect(screen.getByText('£30.00')).toBeInTheDocument();
        expect(screen.getByText('£34.99')).toBeInTheDocument();
        expect(screen.queryByText('Discount Applied')).not.toBeInTheDocument();
    });
});
