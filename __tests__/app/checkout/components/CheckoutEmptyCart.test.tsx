import { CheckoutEmptyCart } from '@/app/checkout/components/CheckoutEmptyCart';
import { render, screen } from '@testing-library/react';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';

describe('CheckoutEmptyCart', () => {
    it('renders empty cart message, icon, and catalog link', () => {
        render(<CheckoutEmptyCart />);

        expect(screen.getByText('Your Bookshelf is Empty')).toBeInTheDocument();
        expect(
            screen.getByText(
                (content) =>
                    content.includes(APP_ERROR_MESSAGES.EMPTY_CART_CHECKOUT) &&
                    content.includes('Discover our curated collection of titles.'),
            ),
        ).toBeInTheDocument();

        const catalogLink = screen.getByRole('link', { name: /explore bookstore catalog/i });
        expect(catalogLink).toBeInTheDocument();
        expect(catalogLink).toHaveAttribute('href', '/');
    });
});
