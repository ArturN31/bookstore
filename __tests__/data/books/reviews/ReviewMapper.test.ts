import { mapToReviewPayload } from '@/data/books/reviews/ReviewMapper';
import { ReviewSchemaInput } from '@/data/schemas/reviewSchema';

describe('mapToReviewPayload', () => {
    it('should correctly map review schema input and bookId to a review payload', () => {
        const input: ReviewSchemaInput = {
            rating: '5',
            review: 'An exceptional read with brilliant insights.',
        };
        const bookId = 'book-123';

        const result = mapToReviewPayload(input, bookId);

        expect(result).toEqual({
            book_id: 'book-123',
            rating: 5,
            review: 'An exceptional read with brilliant insights.',
        });
    });

    it('should correctly convert string rating representation to a number', () => {
        const input: ReviewSchemaInput = {
            rating: '4',
            review: 'Pretty good book overall.',
        };
        const bookId = 'book-456';

        const result = mapToReviewPayload(input, bookId);

        expect(result).toEqual({
            book_id: 'book-456',
            rating: 4,
            review: 'Pretty good book overall.',
        });
        expect(typeof result.rating).toBe('number');
    });
});
