import { mapRowToBook, mapToPaginatedBookResponse } from '@/data/books/BookMapper';

describe('BookMapper', () => {
    describe('mapRowToBook', () => {
        it('should map a complete book row correctly', () => {
            const row = {
                id: 'book-1',
                created_at: '2024-01-01',
                updated_at: '2024-01-02',
                title: 'Test Book',
                author: 'Test Author',
                genre: 'Fiction',
                publisher: 'Test Publisher',
                publication_date: '2024-01-01',
                price: '19.99',
                price_numeric: 19.99,
                description: 'A test book',
                format: 'Hardcover',
                image_url: 'http://example.com/book.jpg',
                page_count: 300,
                stock_quantity: 10,
                is_active: true,
                sales_count: 100,
                avg_rating: 4.5,
                review_count: 10,
                book_reviews: [{ rating: 5 }],
            };

            const book = mapRowToBook(row);

            expect(book.id).toBe('book-1');
            expect(book.title).toBe('Test Book');
            expect(book.author).toBe('Test Author');
            expect(book.rating).toBe(4.5);
        });

        it('should handle null/undefined values with defaults (covers lines 34-37)', () => {
            const row = {
                id: null,
                created_at: null,
                updated_at: null,
                title: null,
                author: null,
                genre: null,
                publisher: null,
                publication_date: null,
                price: null,
                description: null,
                format: null,
                image_url: null,
                page_count: null,
                stock_quantity: null,
                is_active: null,
                sales_count: null,
                avg_rating: null,
                review_count: null,
                book_reviews: null,
            };

            const book = mapRowToBook(row as any);

            expect(book.id).toBe('');
            expect(book.title).toBe('Unknown Title');
            expect(book.author).toBe('Unknown Author');
            expect(book.genre).toBe('Uncategorized');
            expect(book.publisher).toBe('Unknown Publisher');
            expect(book.price).toBe('0.00');
            expect(book.format).toBe('Unknown');
            expect(book.page_count).toBe(0);
            expect(book.stock_quantity).toBe(0);
            expect(book.is_active).toBe(false);
            expect(book.sales_count).toBe(0);
            expect(book.reviews).toEqual([]);
            expect(book.rating).toBe(0);
            expect(book.avg_rating).toBe(0);
            expect(book.review_count).toBe(0);
        });

        it('should handle NaN avg_rating', () => {
            const row = {
                id: 'book-1',
                created_at: '2024-01-01',
                updated_at: '2024-01-02',
                title: 'Test Book',
                author: 'Test Author',
                genre: 'Fiction',
                publisher: 'Test Publisher',
                publication_date: '2024-01-01',
                price: '19.99',
                description: 'A test book',
                format: 'Hardcover',
                image_url: 'http://example.com/book.jpg',
                page_count: 300,
                stock_quantity: 10,
                is_active: true,
                sales_count: 100,
                avg_rating: NaN,
                review_count: 0,
                book_reviews: [],
            };

            const book = mapRowToBook(row as any);

            expect(book.rating).toBe(0);
        });

        it('should handle undefined avg_rating', () => {
            const row = {
                id: 'book-1',
                created_at: '2024-01-01',
                updated_at: '2024-01-02',
                title: 'Test Book',
                author: 'Test Author',
                genre: 'Fiction',
                publisher: 'Test Publisher',
                publication_date: '2024-01-01',
                price: '19.99',
                description: 'A test book',
                format: 'Hardcover',
                image_url: 'http://example.com/book.jpg',
                page_count: 300,
                stock_quantity: 10,
                is_active: true,
                sales_count: 100,
                avg_rating: undefined,
                review_count: 0,
                book_reviews: [],
            };

            const book = mapRowToBook(row as any);

            expect(book.rating).toBe(0);
        });

        it('should handle negative avg_rating values correctly', () => {
            const row = {
                id: 'book-1',
                created_at: '2024-01-01',
                updated_at: '2024-01-02',
                title: 'Test Book',
                author: 'Test Author',
                genre: 'Fiction',
                publisher: 'Test Publisher',
                publication_date: '2024-01-01',
                price: '19.99',
                description: 'A test book',
                format: 'Hardcover',
                image_url: 'http://example.com/book.jpg',
                page_count: 300,
                stock_quantity: 10,
                is_active: true,
                sales_count: 100,
                avg_rating: -1.5,
                review_count: 0,
                book_reviews: [],
            };

            const book = mapRowToBook(row as any);

            expect(book.rating).toBe(-1.5);
        });

        it('should handle very high avg_rating values', () => {
            const row = {
                id: 'book-1',
                created_at: '2024-01-01',
                updated_at: '2024-01-02',
                title: 'Test Book',
                author: 'Test Author',
                genre: 'Fiction',
                publisher: 'Test Publisher',
                publication_date: '2024-01-01',
                price: '19.99',
                description: 'A test book',
                format: 'Hardcover',
                image_url: 'http://example.com/book.jpg',
                page_count: 300,
                stock_quantity: 10,
                is_active: true,
                sales_count: 100,
                avg_rating: 10.0,
                review_count: 0,
                book_reviews: [],
            };

            const book = mapRowToBook(row as any);

            expect(book.rating).toBe(10.0);
        });
    });

    describe('mapToPaginatedBookResponse', () => {
        it('should throw error when page is less than 1', () => {
            const rows = [
                {
                    id: 'book-1',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-02',
                    title: 'Test Book',
                    author: 'Test Author',
                    genre: 'Fiction',
                    publisher: 'Test Publisher',
                    publication_date: '2024-01-01',
                    price: '19.99',
                    description: 'A test book',
                    format: 'Hardcover',
                    image_url: 'http://example.com/book.jpg',
                    page_count: 300,
                    stock_quantity: 10,
                    is_active: true,
                    sales_count: 100,
                    avg_rating: 4.5,
                    review_count: 10,
                    book_reviews: [],
                },
            ];

            expect(() => mapToPaginatedBookResponse(rows as any, 100, 0, 10)).toThrow(
                'Page number must be at least 1',
            );
            expect(() => mapToPaginatedBookResponse(rows as any, 100, -1, 10)).toThrow(
                'Page number must be at least 1',
            );
        });

        it('should return empty data array when limit is negative', () => {
            const rows = [
                {
                    id: 'book-1',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-02',
                    title: 'Test Book',
                    author: 'Test Author',
                    genre: 'Fiction',
                    publisher: 'Test Publisher',
                    publication_date: '2024-01-01',
                    price: '19.99',
                    description: 'A test book',
                    format: 'Hardcover',
                    image_url: 'http://example.com/book.jpg',
                    page_count: 300,
                    stock_quantity: 10,
                    is_active: true,
                    sales_count: 100,
                    avg_rating: 4.5,
                    review_count: 10,
                    book_reviews: [],
                },
            ];

            const result = mapToPaginatedBookResponse(rows as any, 100, 1, -5);

            expect(result.data).toEqual([]);
            expect(result.total).toBe(100);
            expect(result.totalPages).toBe(0);
            expect(result.currentPage).toBe(1);
        });

        it('should return empty data array when limit is negative with multiple books', () => {
            const rows = [
                {
                    id: 'book-1',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-02',
                    title: 'Test Book 1',
                    author: 'Test Author 1',
                    genre: 'Fiction',
                    publisher: 'Test Publisher',
                    publication_date: '2024-01-01',
                    price: '19.99',
                    description: 'A test book',
                    format: 'Hardcover',
                    image_url: 'http://example.com/book1.jpg',
                    page_count: 300,
                    stock_quantity: 10,
                    is_active: true,
                    sales_count: 100,
                    avg_rating: 4.5,
                    review_count: 10,
                    book_reviews: [],
                },
                {
                    id: 'book-2',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-02',
                    title: 'Test Book 2',
                    author: 'Test Author 2',
                    genre: 'Non-Fiction',
                    publisher: 'Test Publisher',
                    publication_date: '2024-01-02',
                    price: '24.99',
                    description: 'Another test book',
                    format: 'Paperback',
                    image_url: 'http://example.com/book2.jpg',
                    page_count: 400,
                    stock_quantity: 5,
                    is_active: true,
                    sales_count: 200,
                    avg_rating: 3.8,
                    review_count: 5,
                    book_reviews: [{ rating: 4 }],
                },
            ];

            const result = mapToPaginatedBookResponse(rows as any, 2, 1, -10);

            expect(result.data).toEqual([]);
            expect(result.total).toBe(2);
            expect(result.totalPages).toBe(0);
            expect(result.currentPage).toBe(1);
        });

        it('should map books with pagination info', () => {
            const rows = [
                {
                    id: 'book-1',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-02',
                    title: 'Test Book',
                    author: 'Test Author',
                    genre: 'Fiction',
                    publisher: 'Test Publisher',
                    publication_date: '2024-01-01',
                    price: '19.99',
                    description: 'A test book',
                    format: 'Hardcover',
                    image_url: 'http://example.com/book.jpg',
                    page_count: 300,
                    stock_quantity: 10,
                    is_active: true,
                    sales_count: 100,
                    avg_rating: 4.5,
                    review_count: 10,
                    book_reviews: [],
                },
            ];

            const result = mapToPaginatedBookResponse(rows as any, 100, 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(100);
            expect(result.totalPages).toBe(10);
            expect(result.currentPage).toBe(1);
        });

        it('should handle empty data array', () => {
            const result = mapToPaginatedBookResponse([], 0, 1, 10);

            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
            expect(result.totalPages).toBe(0);
            expect(result.currentPage).toBe(1);
        });

        it('should calculate totalPages correctly with remainder', () => {
            const result = mapToPaginatedBookResponse([], 11, 1, 10);

            expect(result.totalPages).toBe(2);
        });

        it('should handle edge case with zero limit', () => {
            const result = mapToPaginatedBookResponse([], 10, 1, 0);

            expect(result.totalPages).toBe(0);
        });
    });
});
