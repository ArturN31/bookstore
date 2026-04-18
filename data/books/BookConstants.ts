import { Database } from '@/database.types';

export type FilterableBookColumns = Extract<
    keyof Database['public']['Tables']['books']['Row'],
    'genre' | 'format'
>;

export const BOOK_SORT_OPTIONS = {
    TITLE_ASC: 'Title: A-Z',
    TITLE_DESC: 'Title: Z-A',
    PRICE_LOW: 'Price: Low to High',
    PRICE_HIGH: 'Price: High to Low',
    NEWEST: 'Release Date: Newest to Oldest',
    OLDEST: 'Release Date: Oldest to Newest',
    RATING_HIGH: 'Highest Avg. customer rating',
    RATING_LOW: 'Lowest Avg. customer rating',
    BEST_SELLERS: 'Best Sellers',
} as const;

export type BookSortType = (typeof BOOK_SORT_OPTIONS)[keyof typeof BOOK_SORT_OPTIONS];

export const SORT_MAP: Record<string, { col: string; asc: boolean }> = {
    [BOOK_SORT_OPTIONS.TITLE_ASC]: { col: 'title', asc: true },
    [BOOK_SORT_OPTIONS.TITLE_DESC]: { col: 'title', asc: false },
    [BOOK_SORT_OPTIONS.PRICE_LOW]: { col: 'price_numeric', asc: true },
    [BOOK_SORT_OPTIONS.PRICE_HIGH]: { col: 'price_numeric', asc: false },
    [BOOK_SORT_OPTIONS.NEWEST]: { col: 'publication_date', asc: false },
    [BOOK_SORT_OPTIONS.OLDEST]: { col: 'publication_date', asc: true },
    [BOOK_SORT_OPTIONS.BEST_SELLERS]: { col: 'sales_count', asc: false },
    [BOOK_SORT_OPTIONS.RATING_HIGH]: { col: 'avg_rating', asc: false },
    [BOOK_SORT_OPTIONS.RATING_LOW]: { col: 'avg_rating', asc: true },
};

export interface PaginatedBookResult {
    data: Book[];
    total: number;
    totalPages: number;
    currentPage: number;
}
