import { Database } from '@/database.types';
import { PaginatedBookResult, BOOK_DEFAULTS } from './BookConstants';

type BookViewRow = Database['public']['Views']['books_with_stats']['Row'];

interface BookRowWithReviews extends BookViewRow {
    book_reviews: { rating: number }[] | null;
}

const getReviews = (reviews: { rating: number }[] | null): { rating: number }[] => reviews ?? [];

const calculateRating = (avgRating: number | null | undefined): number => {
    const value = Number(avgRating) || 0;
    return parseFloat(value.toFixed(1));
};

const getAverageRating = (avgRating: number | null | undefined): number => Number(avgRating ?? 0);

const getReviewCount = (reviewCount: number | null | undefined): number => Number(reviewCount ?? 0);

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
        title: title ?? BOOK_DEFAULTS.title,
        author: author ?? BOOK_DEFAULTS.author,
        genre: genre ?? BOOK_DEFAULTS.genre,
        publisher: publisher ?? BOOK_DEFAULTS.publisher,
        publication_date: publication_date ?? '',
        price: price ?? BOOK_DEFAULTS.price,
        description: description ?? '',
        format: format ?? BOOK_DEFAULTS.format,
        image_url: image_url ?? '',
        page_count: page_count ?? BOOK_DEFAULTS.page_count,
        stock_quantity: stock_quantity ?? BOOK_DEFAULTS.stock_quantity,
        is_active: is_active ?? BOOK_DEFAULTS.is_active,
        sales_count: sales_count ?? BOOK_DEFAULTS.sales_count,
        reviews: getReviews(book_reviews) as Review[],
        rating: calculateRating(avg_rating),
        avg_rating: getAverageRating(avg_rating),
        review_count: getReviewCount(review_count),
    };
};

export const mapToPaginatedBookResponse = (
    data: BookRowWithReviews[],
    count: number,
    page: number,
    limit: number,
): PaginatedBookResult => {
    if (page < 1) throw new Error('Page number must be at least 1');

    if (limit <= 0)
        return {
            data: [],
            total: count,
            totalPages: 0,
            currentPage: page,
        };

    return {
        data: data.map(mapRowToBook),
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
    };
};
