import { Database } from '@/database.types';
import { PaginatedBookResult } from './BookConstants';

type BookViewRow = Database['public']['Views']['books_with_stats']['Row'];

export interface BookRowWithReviews extends BookViewRow {
    book_reviews: { rating: number }[] | null;
}

export const mapRowToBook = (row: BookRowWithReviews): Book => {
    const {
        id,
        created_at,
        updated_at,
        title,
        author,
        genre,
        publisher,
        publication_date,
        price,
        description,
        format,
        image_url,
        sales_count,
        avg_rating,
        review_count,
        book_reviews,
        page_count,
        stock_quantity,
        is_active,
    } = row;

    return {
        id: id ?? '',
        created_at: created_at ?? '',
        updated_at: updated_at ?? '',
        title: title ?? 'Unknown Title',
        author: author ?? 'Unknown Author',
        genre: genre ?? 'Uncategorized',
        publisher: publisher ?? 'Unknown Publisher',
        publication_date: publication_date ?? '',
        price: price ?? '0.00',
        description: description ?? '',
        format: format ?? 'Unknown',
        image_url: image_url ?? '',
        page_count: page_count ?? 0,
        stock_quantity: stock_quantity ?? 0,
        is_active: is_active ?? false,
        sales_count: sales_count ?? 0,
        reviews: (book_reviews ?? []) as Review[],
        rating: parseFloat((Number(avg_rating) || 0).toFixed(1)),
        avg_rating: Number(avg_rating ?? 0),
        review_count: Number(review_count ?? 0),
    };
};

export const mapToPaginatedBookResponse = (
    data: BookRowWithReviews[],
    count: number,
    page: number,
    limit: number,
): PaginatedBookResult => ({
    data: data.map(mapRowToBook),
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
});
