'use server';

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
import { createPublicServerClient } from '@/utils/db/publicServer';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 1;
const MIN_PAGE_NUMBER = 1;

const getCachedBooksData = unstable_cache(
    async (page: number, limit: number, filtersSerialized: string) => {
        const filters: FetchBooksFilters = JSON.parse(filtersSerialized);

        return await withRetry(async () => {
            const supabase = await createPublicServerClient();

            const baseQuery = createBaseBookQuery(supabase, filters);
            const sortedQuery = applyBookSorting(baseQuery, filters.sortBy);
            const paginatedQuery = applyBookPagination(sortedQuery, page, limit);

            const { data, error, count } = await paginatedQuery;

            if (error) {
                if (error.code === 'PGRST116')
                    return {
                        data: [],
                        count: 0,
                    };
                throw error;
            }

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
    const rawPage = filters.page ?? 1;
    const rawLimit = filters.limit ?? DEFAULT_PAGE_SIZE;

    if (rawPage < MIN_PAGE_NUMBER || rawLimit < MIN_PAGE_SIZE || rawLimit > MAX_PAGE_SIZE) {
        const safePage = Math.max(MIN_PAGE_NUMBER, rawPage);
        const safeLimit = Math.max(MIN_PAGE_SIZE, Math.min(rawLimit, MAX_PAGE_SIZE));

        return {
            data: mapToPaginatedBookResponse([], 0, safePage, safeLimit),
            error: null,
        };
    }

    try {
        const filtersSerialized = JSON.stringify(filters);
        const result = await getCachedBooksData(rawPage, rawLimit, filtersSerialized);

        return {
            data: mapToPaginatedBookResponse(result.data, result.count, rawPage, rawLimit),
            error: null,
        };
    } catch (err) {
        console.error('[GetBooksData] Orchestration Error:', err);

        const errorMessage =
            err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : 'Failed to retrieve book records after multiple attempts.';

        return {
            data: null,
            error: errorMessage,
        };
    }
};
