import { ReviewInsert } from './ReviewConstants';
import { ReviewSchemaInput } from '@/data/schemas/reviewSchema';

export function mapToReviewPayload(
    data: ReviewSchemaInput,
    bookId: string,
): Omit<ReviewInsert, 'user_id' | 'username'> {
    return {
        book_id: bookId,
        rating: Number(data.rating),
        review: data.review,
    };
}
