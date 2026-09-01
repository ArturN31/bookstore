import {
    createBaseBookQuery,
    getRelatedBooksQuery,
    getBestsellersQuery,
} from '@/data/books/BookRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';

describe('BookRepository Range and Filter Logic', () => {
    let mockSupabase: SupabaseClient<Database>;
    let mockQuery: Record<string, jest.Mock>;

    beforeEach(() => {
        mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
        };

        mockSupabase = {
            from: jest.fn().mockReturnValue(mockQuery),
            rpc: jest.fn().mockReturnValue(mockQuery),
        } as unknown as SupabaseClient<Database>;
    });

    describe('authors filtering', () => {
        it('should apply an "in" filter when authors are provided', () => {
            createBaseBookQuery(mockSupabase, { authors: ['Author A', 'Author B'] });

            expect(mockQuery.in).toHaveBeenCalledWith('author', ['Author A', 'Author B']);
        });

        it('should not apply an "in" filter when authors array is empty', () => {
            createBaseBookQuery(mockSupabase, { authors: [] });

            expect(mockQuery.in).not.toHaveBeenCalledWith('author', expect.any(Array));
        });
    });

    describe('formats filtering', () => {
        it('should apply an "in" filter when formats are provided', () => {
            createBaseBookQuery(mockSupabase, { formats: ['Hardcover', 'Paperback'] });

            expect(mockQuery.in).toHaveBeenCalledWith('format', ['Hardcover', 'Paperback']);
        });
    });

    describe('genres filtering', () => {
        it('should apply an "in" filter when genres are provided', () => {
            createBaseBookQuery(mockSupabase, { genres: ['Fiction', 'Sci-Fi'] });

            expect(mockQuery.in).toHaveBeenCalledWith('genre', ['Fiction', 'Sci-Fi']);
        });
    });

    describe('publishers filtering', () => {
        it('should apply an "in" filter when publishers are provided', () => {
            createBaseBookQuery(mockSupabase, { publishers: ['Publisher X'] });

            expect(mockQuery.in).toHaveBeenCalledWith('publisher', ['Publisher X']);
        });
    });

    describe('pages filtering', () => {
        it('should apply an exact match when a single valid page is provided', () => {
            createBaseBookQuery(mockSupabase, { pages: ['150'] });

            expect(mockQuery.eq).toHaveBeenCalledWith('page_count', 150);
        });

        it('should apply range filters (gte, lte) when multiple valid pages are provided', () => {
            createBaseBookQuery(mockSupabase, { pages: ['100', '300', '200'] });

            expect(mockQuery.gte).toHaveBeenCalledWith('page_count', 100);
            expect(mockQuery.lte).toHaveBeenCalledWith('page_count', 300);
        });

        it('should filter out non-numeric page values', () => {
            createBaseBookQuery(mockSupabase, { pages: ['abc', '150'] });

            expect(mockQuery.eq).toHaveBeenCalledWith('page_count', 150);
        });
    });

    describe('prices filtering', () => {
        it('should apply an exact match when a single valid price is provided', () => {
            createBaseBookQuery(mockSupabase, { prices: ['29.99'] });

            expect(mockQuery.eq).toHaveBeenCalledWith('price', '29.99');
        });

        it('should apply range filters (gte, lte) when multiple valid prices are provided', () => {
            createBaseBookQuery(mockSupabase, { prices: ['10.00', '50.00', '25.00'] });

            expect(mockQuery.gte).toHaveBeenCalledWith('price', '10');
            expect(mockQuery.lte).toHaveBeenCalledWith('price', '50');
        });

        it('should filter out non-numeric price values', () => {
            createBaseBookQuery(mockSupabase, { prices: ['invalid', '19.99'] });

            expect(mockQuery.eq).toHaveBeenCalledWith('price', '19.99');
        });
    });

    describe('publications filtering', () => {
        it('should apply an exact match when a single valid publication date is provided', () => {
            createBaseBookQuery(mockSupabase, { publications: ['2024-01-01'] });

            expect(mockQuery.eq).toHaveBeenCalledWith('publication_date', '2024-01-01');
        });

        it('should apply sorted range filters when multiple publication dates are provided', () => {
            createBaseBookQuery(mockSupabase, {
                publications: ['2024-06-01', '2024-01-01', '2024-12-31'],
            });

            expect(mockQuery.gte).toHaveBeenCalledWith('publication_date', '2024-01-01');
            expect(mockQuery.lte).toHaveBeenCalledWith('publication_date', '2024-12-31');
        });

        it('should filter out falsy publication values', () => {
            createBaseBookQuery(mockSupabase, { publications: ['', '2024-05-15'] });

            expect(mockQuery.eq).toHaveBeenCalledWith('publication_date', '2024-05-15');
        });
    });

    describe('getRelatedBooksQuery', () => {
        it('should invoke rpc with target_book_id and default limit_count of 4', () => {
            getRelatedBooksQuery(mockSupabase, 'book-123');

            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_related_books', {
                target_book_id: 'book-123',
                limit_count: 4,
            });
        });

        it('should invoke rpc with target_book_id and custom limit_count', () => {
            getRelatedBooksQuery(mockSupabase, 'book-123', 8);

            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_related_books', {
                target_book_id: 'book-123',
                limit_count: 8,
            });
        });
    });

    describe('getBestsellersQuery', () => {
        it('should query bestsellers with default limit of 10', () => {
            getBestsellersQuery(mockSupabase);

            expect(mockSupabase.from).toHaveBeenCalledWith('books_with_stats');
            expect(mockQuery.select).toHaveBeenCalledWith('*');
            expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
            expect(mockQuery.order).toHaveBeenCalledWith('sales_count', { ascending: false });
            expect(mockQuery.limit).toHaveBeenCalledWith(10);
        });

        it('should query bestsellers with custom limit', () => {
            getBestsellersQuery(mockSupabase, 5);

            expect(mockSupabase.from).toHaveBeenCalledWith('books_with_stats');
            expect(mockQuery.select).toHaveBeenCalledWith('*');
            expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
            expect(mockQuery.order).toHaveBeenCalledWith('sales_count', { ascending: false });
            expect(mockQuery.limit).toHaveBeenCalledWith(5);
        });
    });
});
