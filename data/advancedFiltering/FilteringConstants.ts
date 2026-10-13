import { Database } from '@/database.types';

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
