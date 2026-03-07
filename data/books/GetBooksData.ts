'use server';

import { createBackendClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';

export type FilterableBookColumns = Extract<keyof Book, 'genre' | 'format'>;

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

export interface FetchBooksResponse {
    data: Book[];
    total: number;
    totalPages: number;
    currentPage: number;
    error: string | null;
}

const enrichBookData = (book: any): Book => {
    const reviews = book.book_reviews || [];
    const totalRating = reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
        ...book,
        rating: avgRating,
        reviews: reviews,
    };
};

const createEmptyResponse = (page: number, error: string | null = null): FetchBooksResponse => ({
    data: [],
    total: 0,
    totalPages: 0,
    currentPage: page,
    error,
});

export const fetchBooksWithReviews = async ({
    bookID,
    bookIDs,
    group,
    type,
    page = 1,
    limit = 10,
    onlyActive = true,
    sortBy = 'Title: A-Z',
}: FetchBooksFilters = {}): Promise<FetchBooksResponse> => {
    try {
        const supabase = await createBackendClient();

        const isSingleBook = !!bookID;
        const reviewSelector = isSingleBook ? 'book_reviews(*)' : 'book_reviews(rating)';

        let query = supabase.from('books').select(`*, ${reviewSelector}`, { count: 'exact' });

        if (bookID) query = query.eq('id', bookID);
        if (bookIDs && bookIDs.length > 0) query = query.in('id', bookIDs);
        if (group && type) query = query.eq(group, type);
        if (onlyActive) query = query.eq('is_active', true);

        switch (sortBy) {
            case 'Title: Z-A':
                query = query.order('title', { ascending: false });
                break;
            case 'Price: Low to High':
                query = query.order('price' as any, {
                    ascending: true,
                });
                break;
            case 'Price: High to Low':
                query = query.order('price' as any, { ascending: false });
                break;
            case 'Release Date: Newest to Oldest':
                query = query.order('created_at', { ascending: false });
                break;
            case 'Release Date: Oldest to Newest':
                query = query.order('created_at', { ascending: true });
                break;
            case 'Best Sellers':
                query = query.order('sales_count', { ascending: false });
                break;
            case 'Title: A-Z':
            default:
                query = query.order('title', { ascending: true });
                break;
        }

        const startIndex = (page - 1) * limit;
        query = query.range(startIndex, startIndex + limit - 1);

        const { data, error, count }: PostgrestResponse<any> = await query;

        if (error && error.code !== 'PGRST116') {
            console.error('FetchBooks Database Error:', error.message);
            return createEmptyResponse(page, 'Internal Server Error');
        }

        const enrichedData: Book[] = (data || []).map(enrichBookData);

        return {
            data: enrichedData,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            currentPage: page,
            error: null,
        };
    } catch (err) {
        console.error('FetchBooks Unexpected Error:', err);
        return createEmptyResponse(page, 'An unexpected error occurred');
    }
};
