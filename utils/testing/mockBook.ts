/**
 * Global Test Helper: Centralized Mock Book Factory & Autonomous Generators
 */
export const createMockBook = (overrides: Partial<Book> = {}): Book => {
    const stripe_price_id =
        overrides.stripe_price_id !== undefined ? overrides.stripe_price_id : null;
    const stripe_product_id =
        overrides.stripe_product_id !== undefined ? overrides.stripe_product_id : null;

    return {
        id: '1',
        title: 'Default Book Title',
        author: 'Default Author',
        genre: 'Fiction',
        description: 'Default mock description.',
        price: '10.00',
        rating: 4,
        review_count: 10,
        sales_count: null,
        stock_quantity: 100,
        image_url: 'https://example.com/cover.jpg',
        publisher: 'Default Publisher',
        publication_date: '2024-01-01',
        format: 'Paperback',
        page_count: 200,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        is_active: true,
        reviews: [],
        ...overrides,
        stripe_price_id,
        stripe_product_id,
    };
};

/**
 * Automatically generates an array of fully populated mock books on its own.
 * Just call `createMockBooksArray()` or pass a count like `createMockBooksArray(3)`.
 */
export const createMockBooksArray = (
    count: number = 3,
    baseOverrides: Partial<Book> = {},
): Book[] => {
    return Array.from({ length: count }, (_, index) => {
        const num = index + 1;
        return createMockBook({
            id: `mock-book-id-${num}`,
            title: `The Mock Book ${num}`,
            author: `Author ${num}`,
            price: `${(10 + num * 4.99).toFixed(2)}`,
            ...baseOverrides,
        });
    });
};

/**
 * Standard pre-built mock books array for standard carousel/search tests
 */
export const mockBooks: readonly Book[] = createMockBooksArray(3, {
    publisher: 'Mock Publisher',
    image_url: 'http://example.com/mock.jpg',
});
