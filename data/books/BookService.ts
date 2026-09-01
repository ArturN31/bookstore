'use server';

import {
    createBaseBookQuery,
    applyBookSorting,
    applyBookPagination,
    getRelatedBooksQuery,
    BookQueryParams,
    getBestsellersQuery,
} from './BookRepository';
import { mapToPaginatedBookResponse } from './BookMapper';
import {
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    MIN_PAGE_SIZE,
    MIN_PAGE_NUMBER,
    PaginatedBookResult,
} from './BookConstants';
import { Tables } from '@/database.types';
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

export const getCachedRelatedBooksData = unstable_cache(
    async (bookId: string, limit: number) => {
        const supabase = await createPublicServerClient();

        return await safeSupabaseQuery(async () => {
            const response = await getRelatedBooksQuery(supabase, bookId, limit);
            if (response.error) return { data: null, error: response.error };

            return {
                data: response.data || [],
                error: null,
            };
        });
    },
    ['related-books-results'],
    {
        revalidate: 600,
        tags: ['books'],
    },
);

export const fetchRelatedBooks = async (
    bookId: string,
    limit: number = 12,
): Promise<ActionResponse<Tables<'books_with_stats'>[]>> => {
    if (!bookId)
        return {
            data: [],
            error: null,
        };

    try {
        const result = await getCachedRelatedBooksData(bookId, limit);
        if (result.error)
            return {
                data: null,
                error: sanitizeSupabaseError(result.error),
            };

        return {
            data: (result.data as Tables<'books_with_stats'>[]) || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error('[BookService] Related Books Error:', err);

        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};

export const getCachedBestsellersData = unstable_cache(
    async (limit: number) => {
        const supabase = await createPublicServerClient();

        return await safeSupabaseQuery(async () => {
            const response = await getBestsellersQuery(supabase, limit);
            if (response.error) return { data: null, error: response.error };

            return {
                data: response.data || [],
                error: null,
            };
        });
    },
    ['bestsellers-results'],
    {
        revalidate: 600,
        tags: ['books'],
    },
);

export const fetchBestsellers = async (
    limit: number = 10,
): Promise<ActionResponse<Tables<'books_with_stats'>[]>> => {
    try {
        const result = await getCachedBestsellersData(limit);
        if (result.error)
            return {
                data: null,
                error: sanitizeSupabaseError(result.error),
            };

        return {
            data: (result.data as Tables<'books_with_stats'>[]) || [],
            error: null,
        };
    } catch (err: unknown) {
        console.error('[BookService] Bestsellers Error:', err);

        return {
            data: null,
            error: sanitizeSupabaseError(err),
        };
    }
};
