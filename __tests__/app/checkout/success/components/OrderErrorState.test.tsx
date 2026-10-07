import { OrderErrorState } from '@/app/checkout/success/components/OrderErrorState';
import { render, screen } from '@testing-library/react';

describe('OrderErrorState Component', () => {
    it('renders the given title and message correctly', () => {
        const testTitle = 'Order Not Found';
        const testMessage = 'The requested order could not be located or does not exist.';

        render(
            <OrderErrorState
                title={testTitle}
                message={testMessage}
            />,
        );

        expect(screen.getByText(testTitle)).toBeInTheDocument();
        expect(screen.getByText(testMessage)).toBeInTheDocument();
    });

    it('renders the return to storefront link with correct href', () => {
        render(
            <OrderErrorState
                title="Error"
                message="Something went wrong."
            />,
        );

        const storefrontLink = screen.getByRole('link', { name: /return to storefront/i });
        expect(storefrontLink).toBeInTheDocument();
        expect(storefrontLink).toHaveAttribute('href', '/');
    });
});
