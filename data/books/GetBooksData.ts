'use server';

import { createClient } from '@supabase/supabase-js';
import {
    createBaseBookQuery,
    applyBookSorting,
    applyBookPagination,
    FetchBooksFilters,
} from './BookRepository';
import { mapToPaginatedBookResponse } from './BookMapper';
import { PaginatedBookResult } from './BookConstants';
import { withRetry } from '@/utils/network/retry';
import { unstable_cache } from 'next/cache';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 1;
const MIN_PAGE_NUMBER = 1;

const getCachedBooksData = unstable_cache(
    async (page: number, limit: number, filtersSerialized: string) => {
        const filters: FetchBooksFilters = JSON.parse(filtersSerialized);

        return await withRetry(async () => {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_DB_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
            );

            const baseQuery = createBaseBookQuery(supabase, filters);
            const sortedQuery = applyBookSorting(baseQuery, filters.sortBy);
            const paginatedQuery = applyBookPagination(sortedQuery, page, limit);

            const { data, error, count } = await paginatedQuery;

            if (error) throw error;

            return {
                data: data || [],
                count: count || 0,
            };
        });
    },
    ['books-search-results'],
    {
        revalidate: 600,
        tags: ['books'],
    },
);

export const fetchBooksWithReviews = async (
    filters: FetchBooksFilters = {},
): Promise<ActionResponse<PaginatedBookResult>> => {
    const page = Math.max(MIN_PAGE_NUMBER, filters.page || 1);
    const limit = Math.max(
        MIN_PAGE_SIZE,
        Math.min(filters.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    );

    try {
        const filtersSerialized = JSON.stringify(filters);
        const result = await getCachedBooksData(page, limit, filtersSerialized);

        return {
            data: mapToPaginatedBookResponse(result.data, result.count, page, limit),
            error: null,
        };
    } catch (err) {
        console.error('[GetBooksData] Orchestration Error:', err);
        return {
            data: null,
            error:
                err instanceof Error
                    ? err.message
                    : 'Failed to retrieve book records after multiple attempts.',
        };
    }
};
