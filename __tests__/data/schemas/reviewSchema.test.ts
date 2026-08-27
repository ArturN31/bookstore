import { reviewSchema } from '@/data/schemas/reviewSchema';

describe('reviewSchema', () => {
    const validReviewInput = {
        rating: '5',
        review: 'This was an excellent read from start to finish!',
    };

    describe('rating field', () => {
        it.each(['1', '2', '3', '4', '5'])(
            'should pass for valid integer rating string: %s',
            (rating) => {
                const result = reviewSchema.safeParse({
                    ...validReviewInput,
                    rating,
                });

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.rating).toBe(rating);
                }
            },
        );

        it('should trim surrounding whitespace from rating string', () => {
            const result = reviewSchema.safeParse({
                ...validReviewInput,
                rating: '  4  ',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.rating).toBe('4');
            }
        });

        it('should fail when rating is empty or whitespace only', () => {
            const result = reviewSchema.safeParse({
                ...validReviewInput,
                rating: '   ',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('rating'));
                expect(issue?.message).toBe('Please select a rating');
            }
        });

        it.each(['0', '6', '-1', '10'])(
            'should fail when rating is out of 1-5 range: %s',
            (rating) => {
                const result = reviewSchema.safeParse({
                    ...validReviewInput,
                    rating,
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('rating'));
                    expect(issue?.message).toBe('Rating must be an integer between 1 and 5 stars');
                }
            },
        );

        it.each(['3.5', '4.2', '2.001'])(
            'should fail when rating is a non-integer float: %s',
            (rating) => {
                const result = reviewSchema.safeParse({
                    ...validReviewInput,
                    rating,
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('rating'));
                    expect(issue?.message).toBe('Rating must be an integer between 1 and 5 stars');
                }
            },
        );

        it('should fail when rating is a non-numeric string', () => {
            const result = reviewSchema.safeParse({
                ...validReviewInput,
                rating: 'five',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('rating'));
                expect(issue?.message).toBe('Rating must be an integer between 1 and 5 stars');
            }
        });
    });

    describe('review field', () => {
        it('should pass with a valid review comment', () => {
            const result = reviewSchema.safeParse(validReviewInput);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.review).toBe(validReviewInput.review);
            }
        });

        it('should sanitize HTML tags and trim surrounding whitespace from review text', () => {
            const result = reviewSchema.safeParse({
                ...validReviewInput,
                review: '  <div><p>Great book!</p></div>  ',
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.review).toBe('Great book!');
            }
        });

        it('should fail if review text is under 3 characters after HTML sanitization', () => {
            const result = reviewSchema.safeParse({
                ...validReviewInput,
                review: ' <span>Hi</span> ',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('review'));
                expect(issue?.message).toBe('Review comment must be at least 3 characters');
            }
        });

        it('should pass at maximum boundary of 2000 characters', () => {
            const longReview = 'A'.repeat(2000);
            const result = reviewSchema.safeParse({
                ...validReviewInput,
                review: longReview,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.review).toBe(longReview);
            }
        });

        it('should fail if review text exceeds 2000 characters', () => {
            const overLimitReview = 'A'.repeat(2001);
            const result = reviewSchema.safeParse({
                ...validReviewInput,
                review: overLimitReview,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('review'));
                expect(issue?.message).toBe('Review comment cannot exceed 2000 characters');
            }
        });
    });
});
