import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Tables } from '@/database.types';
import { SORT_MAP, BOOK_SORT_OPTIONS, FilterableBookColumns } from './BookConstants';

export interface BookQueryParams {
    bookID?: string;
    bookIDs?: string[];
    group?: FilterableBookColumns;
    type?: string;
    page?: number;
    limit?: number;
    onlyActive?: boolean;
    sortBy?: string;

    authors?: string[];
    formats?: string[];
    genres?: string[];
    publishers?: string[];
    pages?: string[];
    prices?: string[];
    publications?: string[];
}

export const createBaseBookQuery = (
    supabase: SupabaseClient<Database>,
    params: BookQueryParams,
) => {
    const selector = params.bookID ? 'book_reviews(*)' : 'book_reviews(rating)';

    let query = supabase.from('books_with_stats').select(`*, ${selector}`, { count: 'exact' });

    if (params.bookID) query = query.eq('id', params.bookID);
    if (params.bookIDs?.length) query = query.in('id', params.bookIDs);
    if (params.group && params.type) query = query.eq(params.group, params.type);
    if (params.onlyActive !== false) query = query.eq('is_active', true);

    if (params.authors && params.authors.length > 0) query = query.in('author', params.authors);
    if (params.formats && params.formats.length > 0) query = query.in('format', params.formats);
    if (params.genres && params.genres.length > 0) query = query.in('genre', params.genres);
    if (params.publishers && params.publishers.length > 0)
        query = query.in('publisher', params.publishers);

    if (params.pages && params.pages.length > 0) {
        const numericPages = params.pages.map(Number).filter((n) => !isNaN(n));
        if (numericPages.length === 1) query = query.eq('page_count', numericPages[0]);
        else if (numericPages.length >= 2) {
            const min = Math.min(...numericPages);
            const max = Math.max(...numericPages);
            query = query.gte('page_count', min).lte('page_count', max);
        }
    }

    if (params.prices && params.prices.length > 0) {
        const numericPrices = params.prices.map(Number).filter((n) => !isNaN(n));
        if (numericPrices.length === 1) query = query.eq('price', numericPrices[0].toString());
        else if (numericPrices.length >= 2) {
            const min = Math.min(...numericPrices);
            const max = Math.max(...numericPrices);
            query = query.gte('price', min.toString()).lte('price', max.toString());
        }
    }

    if (params.publications && params.publications.length > 0) {
        const validDates = params.publications.filter(Boolean).sort();
        if (validDates.length === 1) query = query.eq('publication_date', validDates[0]);
        else if (validDates.length >= 2) {
            query = query
                .gte('publication_date', validDates[0])
                .lte('publication_date', validDates[validDates.length - 1]);
        }
    }

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

export const getRelatedBooksQuery = (
    supabase: SupabaseClient<Database>,
    targetBookId: string,
    limitCount: number = 4,
) => {
    type RelatedBooksRPC = {
        get_related_books: {
            Args: {
                target_book_id: string;
                limit_count: number;
            };
            Returns: Tables<'books_with_stats'>[];
        };
    };

    const clientWithRPC = supabase as unknown as SupabaseClient<{
        public: {
            Tables: Database['public']['Tables'];
            Views: Database['public']['Views'];
            Functions: Database['public']['Functions'] & RelatedBooksRPC;
            Enums: Database['public']['Enums'];
            CompositeTypes: Database['public']['CompositeTypes'];
        };
    }>;

    return clientWithRPC.rpc('get_related_books', {
        target_book_id: targetBookId,
        limit_count: limitCount,
    });
};
