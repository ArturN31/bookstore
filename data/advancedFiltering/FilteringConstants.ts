import { Database } from '@/database.types';
import { createFrontendClient } from '@/utils/db/client';

type BookRow = Database['public']['Tables']['books']['Row'];

export type FilteringTypes = {
    AUTHORS: NonNullable<BookRow['author']>[];
    FORMATS: NonNullable<BookRow['format']>[];
    GENRES: NonNullable<BookRow['genre']>[];
    PAGES: NonNullable<BookRow['page_count']>[];
    PRICES: NonNullable<BookRow['price']>[];
    PUBLICATIONS: NonNullable<BookRow['publication_date']>[];
    PUBLISHERS: NonNullable<BookRow['publisher']>[];
};

export const DEFAULT_FILTERING_CONSTANTS: FilteringTypes = {
    AUTHORS: [],
    FORMATS: [],
    GENRES: [],
    PAGES: [],
    PRICES: [],
    PUBLICATIONS: [],
    PUBLISHERS: [],
};

type BookFilterRow = Pick<
    BookRow,
    'author' | 'format' | 'genre' | 'page_count' | 'price' | 'publication_date' | 'publisher'
>;

export const CATEGORY_LABELS: Record<keyof FilteringTypes, string> = {
    AUTHORS: 'Authors',
    FORMATS: 'Format',
    GENRES: 'Genre',
    PAGES: 'Page Count',
    PRICES: 'Price (£)',
    PUBLICATIONS: 'Publication Date',
    PUBLISHERS: 'Publisher',
};

export const NUMERIC_CATEGORIES: (keyof FilteringTypes)[] = ['PAGES', 'PRICES'];

export const getFilteringConstants = async (): Promise<FilteringTypes> => {
    const supabase = await createFrontendClient();

    const { data, error } = await supabase
        .from('books')
        .select('author, format, genre, page_count, price, publication_date, publisher');

    if (error || !data) {
        console.error('Failed to load filter constants:', error);
        return DEFAULT_FILTERING_CONSTANTS;
    }

    const authors = new Set<NonNullable<BookRow['author']>>();
    const formats = new Set<NonNullable<BookRow['format']>>();
    const genres = new Set<NonNullable<BookRow['genre']>>();
    const pages = new Set<NonNullable<BookRow['page_count']>>();
    const prices = new Set<NonNullable<BookRow['price']>>();
    const publications = new Set<NonNullable<BookRow['publication_date']>>();
    const publishers = new Set<NonNullable<BookRow['publisher']>>();

    (data as BookFilterRow[]).forEach((book) => {
        if (book.author) authors.add(book.author);
        if (book.format) formats.add(book.format);
        if (book.genre) genres.add(book.genre);
        if (book.page_count !== null) pages.add(book.page_count);
        if (book.price !== null) prices.add(book.price);
        if (book.publication_date) publications.add(book.publication_date);
        if (book.publisher) publishers.add(book.publisher);
    });

    return {
        AUTHORS: Array.from(authors),
        FORMATS: Array.from(formats),
        GENRES: Array.from(genres),
        PAGES: Array.from(pages),
        PRICES: Array.from(prices),
        PUBLICATIONS: Array.from(publications),
        PUBLISHERS: Array.from(publishers),
    };
};
