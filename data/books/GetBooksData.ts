'use server';

import { createBackendClient } from '@/utils/db/server';
import {
    createBaseBookQuery,
    applyBookSorting,
    applyBookPagination,
    FetchBooksFilters,
} from './BookRepository';
import { mapToPaginatedBookResponse } from './BookMapper';
import { PaginatedBookResult } from './BookConstants';
import { withRetry } from '@/utils/network/retry';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MIN_PAGE_SIZE = 1;
const MIN_PAGE_NUMBER = 1;

export const fetchBooksWithReviews = async (
    filters: FetchBooksFilters = {},
): Promise<ActionResponse<PaginatedBookResult>> => {
    const page = Math.max(MIN_PAGE_NUMBER, filters.page || 1);
    const limit = Math.max(
        MIN_PAGE_SIZE,
        Math.min(filters.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    );

    try {
        const result = await withRetry(async () => {
            const supabase = await createBackendClient();
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
