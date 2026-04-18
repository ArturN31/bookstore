import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/database.types';
import { SORT_MAP, BOOK_SORT_OPTIONS, FilterableBookColumns } from './BookConstants';

export interface FetchBooksFilters {
    bookID?: string;
    bookIDs?: string[];
    group?: FilterableBookColumns;
    type?: string;
    page?: number;
    limit?: number;
    onlyActive?: boolean;
    sortBy?: string;
}

export const createBaseBookQuery = (
    supabase: SupabaseClient<Database>,
    filters: FetchBooksFilters,
) => {
    const selector = filters.bookID ? 'book_reviews(*)' : 'book_reviews(rating)';

    let query = supabase.from('books_with_stats').select(`*, ${selector}`, { count: 'exact' });

    if (filters.bookID) query = query.eq('id', filters.bookID);
    if (filters.bookIDs?.length) query = query.in('id', filters.bookIDs);
    if (filters.group && filters.type) query = query.eq(filters.group, filters.type);
    if (filters.onlyActive !== false) query = query.eq('is_active', true);

    return query;
};

export type BaseBookQueryType = ReturnType<typeof createBaseBookQuery>;

export const applyBookSorting = (query: BaseBookQueryType, sortBy?: string) => {
    const config = SORT_MAP[sortBy || ''] || SORT_MAP[BOOK_SORT_OPTIONS.TITLE_ASC];
    return query.order(config.col, { ascending: config.asc });
};

export type SortedBookQueryType = ReturnType<typeof applyBookSorting>;

export const applyBookPagination = (query: SortedBookQueryType, page: number, limit: number) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return query.range(from, to);
};
