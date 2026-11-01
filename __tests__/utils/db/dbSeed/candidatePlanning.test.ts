import {
    isCandidateCapacityError,
    naturalPairKey,
    normalizeNaturalKey,
    planUniqueCandidates,
} from '@/utils/db/dbSeed/candidatePlanning';
import {
    generateReviewsArray,
    reviewNaturalKey,
} from '@/utils/db/dbSeed/generateReview';

jest.mock('@faker-js/faker/locale/en_GB', () => ({
    faker: {
        date: { past: jest.fn(() => new Date('2026-01-01T00:00:00.000Z')) },
        string: { uuid: jest.fn(() => 'review-id') },
        lorem: { paragraph: jest.fn(() => 'Generated review') },
    },
}));

describe('candidate planning', () => {
    it('normalizes natural keys and selects unique candidates', () => {
        const candidates = ['  The   Title ', 'the title', 'Another Title'];

        const planned = planUniqueCandidates(
            candidates,
            2,
            (candidate) => [normalizeNaturalKey(candidate)],
        );

        expect(planned).toEqual(['  The   Title ', 'Another Title']);
    });

    it('excludes existing keys and reports finite candidate capacity', () => {
        let error: unknown;

        try {
            planUniqueCandidates(['one', 'one', 'two'], 3, (candidate) => [candidate], ['one']);
        } catch (caught) {
            error = caught;
        }

        expect(isCandidateCapacityError(error)).toBe(true);
        expect(error).toMatchObject({ requestedCount: 3, availableCount: 1 });
    });

    it('deduplicates across multiple independently constrained keys', () => {
        const candidates = [
            { email: 'first@example.com', username: 'first' },
            { email: 'second@example.com', username: 'first' },
            { email: 'second@example.com', username: 'second' },
        ];

        const planned = planUniqueCandidates(
            candidates,
            1,
            ({ email, username }) => [`email:${email}`, `username:${username}`],
        );

        expect(planned).toEqual([candidates[0]]);
    });

    it('rejects invalid counts', () => {
        expect(() => planUniqueCandidates([], -1, () => ['key'])).toThrow(RangeError);
        expect(() => planUniqueCandidates([], 1.5, () => ['key'])).toThrow(RangeError);
    });
});

describe('review candidate planning', () => {
    const books = [{ id: 'book-1' }, { id: 'book-2' }] as BookDB[];
    const users = [
        { id: 'user-1', username: 'user1' },
        { id: 'user-2', username: 'user2' },
    ];

    it('generates exactly the requested count from available user/book pairs', () => {
        const existingKey = reviewNaturalKey('user-1', 'book-1');
        const reviews = generateReviewsArray(books, 3, users, [existingKey]);

        expect(reviews).toHaveLength(3);
        expect(new Set(reviews.map((review) => naturalPairKey(review.user_id, review.book_id))).size)
            .toBe(3);
        expect(
            reviews.some(
                (review) => reviewNaturalKey(review.user_id, review.book_id) === existingKey,
            ),
        ).toBe(false);
    });

    it('samples review pairs across the finite candidate space', () => {
        const reviews = generateReviewsArray(books, 2, users, [], () => 0.5);

        expect(new Set(reviews.map((review) => review.book_id)).size).toBe(2);
    });

    it('reports exact review-pair capacity instead of returning a partial batch', () => {
        const existingKeys = [
            reviewNaturalKey('user-1', 'book-1'),
            reviewNaturalKey('user-1', 'book-2'),
        ];
        let error: unknown;

        try {
            generateReviewsArray(books, 3, users, existingKeys);
        } catch (caught) {
            error = caught;
        }

        expect(isCandidateCapacityError(error)).toBe(true);
        expect(error).toMatchObject({ requestedCount: 3, availableCount: 2 });
    });
});
