import { INITIAL_EMPTY_STATE, REVIEW_ROUTES } from '@/data/books/reviews/ReviewConstants';

describe('ReviewConstants', () => {
    it('should have the correct initial empty state', () => {
        expect(INITIAL_EMPTY_STATE).toEqual({
            message: null,
            error: null,
            validationErrors: [],
        });
    });

    it('should have the correct review routes', () => {
        expect(REVIEW_ROUTES).toEqual({
            BOOK_PAGE: '/book/[id]',
            HOMEPAGE: '/',
        });
    });
});
