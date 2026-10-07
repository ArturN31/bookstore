import { CartItem } from '@/data/cart/CartMapper';

/**
 * Automatically generates a mock CartItem with autonomous defaults.
 */
export const createMockCartItem = (overrides: Partial<CartItem> = {}): CartItem => {
    const stripe_price_id =
        overrides.stripe_price_id !== undefined ? overrides.stripe_price_id : null;
    const stripe_product_id =
        overrides.stripe_product_id !== undefined ? overrides.stripe_product_id : null;

    return {
        id: 'book-1',
        title: 'Test Book',
        price: '20.00',
        quantity: 1,
        author: 'Test Author',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        description: 'Desc',
        format: 'Paperback',
        genre: 'Fiction',
        image_url: 'https://example.com/img.jpg',
        is_active: true,
        page_count: 100,
        publication_date: '2026-01-01',
        publisher: 'Publisher',
        sales_count: 0,
        stock_quantity: 10,
        ...overrides,
        stripe_price_id,
        stripe_product_id,
    };
};

/**
 * Automatically generates an array of fully populated mock cart items on its own.
 */
export const createMockCartItemsArray = (
    count: number = 1,
    baseOverrides: Partial<CartItem> = {},
): CartItem[] => {
    return Array.from({ length: count }, (_, index) => {
        const num = index + 1;
        return createMockCartItem({
            id: `book-${num}`,
            title: `Test Book ${num}`,
            ...baseOverrides,
        });
    });
};
