'use server';

import {
    createBaseBookQuery,
    applyBookSorting,
    applyBookPagination,
    BookQueryParams,
} from './BookRepository';
import { mapToPaginatedBookResponse } from './BookMapper';
import {
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    MIN_PAGE_SIZE,
    MIN_PAGE_NUMBER,
    PaginatedBookResult,
} from './BookConstants';
import { unstable_cache } from 'next/cache';
import { createPublicServerClient } from '@/utils/db/publicServer';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

const getCachedBooksData = unstable_cache(
    async (page: number, limit: number, paramsSerialized: string) => {
        const params: BookQueryParams = JSON.parse(paramsSerialized);

        const supabase = await createPublicServerClient();

        const baseQuery = createBaseBookQuery(supabase, params);
        const sortedQuery = applyBookSorting(baseQuery, params.sortBy);
        const paginatedQuery = applyBookPagination(sortedQuery, page, limit);

        return await safeSupabaseQuery(async () => {
            const response = await paginatedQuery;

            if (response.error) {
                if (response.error.code === 'PGRST116')
                    return {
                        data: { data: [], count: 0 },
                        error: null,
                    };
                return { data: null, error: response.error };
            }

            return {
                data: {
                    data: response.data || [],
                    count: response.count || 0,
                },
                error: null,
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
    params: BookQueryParams = {},
): Promise<ActionResponse<PaginatedBookResult>> => {
    const rawPage = params.page ?? 1;
    const rawLimit = params.limit ?? DEFAULT_PAGE_SIZE;

    if (rawPage < MIN_PAGE_NUMBER || rawLimit < MIN_PAGE_SIZE || rawLimit > MAX_PAGE_SIZE) {
        const safePage = Math.max(MIN_PAGE_NUMBER, rawPage);
        const safeLimit = Math.max(MIN_PAGE_SIZE, Math.min(rawLimit, MAX_PAGE_SIZE));

        return {
            data: mapToPaginatedBookResponse([], 0, safePage, safeLimit),
            error: null,
        };
    }

    try {
        const paramsSerialized = JSON.stringify(params);
        const result = await getCachedBooksData(rawPage, rawLimit, paramsSerialized);
        if (result.error)
            return {
                data: null,
                error: sanitizeSupabaseError(result.error),
            };
        if (!result.data)
            return {
                data: mapToPaginatedBookResponse([], 0, rawPage, rawLimit),
                error: null,
            };

        return {
            data: mapToPaginatedBookResponse(
                result.data.data,
                result.data.count,
                rawPage,
                rawLimit,
            ),
            error: null,
        };
    } catch (err: unknown) {
        console.error('[BookService] Orchestration Error:', err);

        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
