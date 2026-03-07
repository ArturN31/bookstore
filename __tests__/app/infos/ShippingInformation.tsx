import ShipppingInformation from '@/app/infos/shippinginfo/page';
import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
    })),
}));

jest.mock('@/providers/cart/CartProvider', () => ({
    useCartState: jest.fn(() => ({
        cartBooks: [],
        loading: false,
    })),
}));

jest.mock('@/app/layout', () => ({
    Layout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-layout">{children}</div>
    ),
}));

describe('APP - Infos - ShipppingInformation', () => {
    it('Should render the page', async () => {
        const element = ShipppingInformation();
        render(element);
        const header = await screen.findByTestId('shipping-info-header');
        expect(header).toBeInTheDocument();
    });
});
