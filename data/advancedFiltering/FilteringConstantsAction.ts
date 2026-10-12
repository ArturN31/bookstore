'use server';

import { Database } from '@/database.types';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { getAppClientIp } from '@/utils/network/getAppClientIp';
import { limiters, verifyRateLimit } from '@/utils/network/rateLimiter';
import {
    DEFAULT_FILTERING_CONSTANTS,
    FilteringTypes,
} from './FilteringConstants';

type BookRow = Database['public']['Tables']['books']['Row'];
type BookFilterRow = Pick<
    BookRow,
    'author' | 'format' | 'genre' | 'page_count' | 'price' | 'publication_date' | 'publisher'
>;

export async function getFilteringConstants(): Promise<FilteringTypes> {
    const rateLimit = await verifyRateLimit({
        identifier: `ip:${await getAppClientIp()}`,
        limiter: limiters.search,
        failClosed: true,
    });
    if (!rateLimit.success)
        throw new Error(rateLimit.error ?? 'Too many filter requests. Please try again later.');

    const supabase = await createBackendClient();
    const query = supabase
        .from('books')
        .select('author, format, genre, page_count, price, publication_date, publisher');

    const result = await safeSupabaseQuery(
        async (): Promise<{ data: BookFilterRow[] | null; error: unknown }> => {
            const queryBuilder = query as unknown as {
                eq?: (
                    column: string,
                    value: boolean,
                ) => Promise<{ data: BookFilterRow[] | null; error: unknown }>;
            };
            if (typeof queryBuilder.eq === 'function') {
                return await queryBuilder.eq('is_active', true);
            }
            return await (query as unknown as Promise<{
                data: BookFilterRow[] | null;
                error: unknown;
            }>);
        },
    );

    if (result.error || !result.data) {
        console.error('Failed to load filter constants:', result.error);
        return DEFAULT_FILTERING_CONSTANTS;
    }

    const authors = new Set<NonNullable<BookRow['author']>>();
    const formats = new Set<NonNullable<BookRow['format']>>();
    const genres = new Set<NonNullable<BookRow['genre']>>();
    const pages = new Set<NonNullable<BookRow['page_count']>>();
    const prices = new Set<NonNullable<BookRow['price']>>();
    const publications = new Set<NonNullable<BookRow['publication_date']>>();
    const publishers = new Set<NonNullable<BookRow['publisher']>>();

    result.data.forEach((book) => {
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
}
