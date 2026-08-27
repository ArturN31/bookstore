import { wishlistSchema } from '@/data/schemas/wishlistSchema';

describe('wishlistSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    describe('bookId field', () => {
        it('should pass with a valid UUID', () => {
            const payload = {
                bookId: validUuid,
                actionType: 'INSERT',
            };

            const result = wishlistSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookId).toBe(validUuid);
            }
        });

        it('should trim surrounding whitespace from bookId', () => {
            const payload = {
                bookId: `   ${validUuid}   `,
                actionType: 'INSERT',
            };

            const result = wishlistSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookId).toBe(validUuid);
            }
        });

        it('should fail when bookId is an empty string or whitespace only', () => {
            const payload = {
                bookId: '   ',
                actionType: 'INSERT',
            };

            const result = wishlistSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('bookId'));
                expect(issue?.message).toBe('Book ID is required');
            }
        });

        it('should fail when bookId is not a valid UUID format', () => {
            const payload = {
                bookId: 'invalid-uuid-format',
                actionType: 'INSERT',
            };

            const result = wishlistSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('bookId'));
                expect(issue?.message).toBe('Invalid Book ID format.');
            }
        });
    });

    describe('actionType field', () => {
        it.each(['INSERT', 'REMOVE'] as const)(
            'should pass for valid actionType: %s',
            (actionType) => {
                const payload = {
                    bookId: validUuid,
                    actionType,
                };

                const result = wishlistSchema.safeParse(payload);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.actionType).toBe(actionType);
                }
            },
        );

        it.each(['UPDATE', 'DELETE', 'INSERT_MANY', ''])(
            'should fail for invalid actionType: %s',
            (actionType) => {
                const payload = {
                    bookId: validUuid,
                    actionType,
                };

                const result = wishlistSchema.safeParse(payload);
                expect(result.success).toBe(false);
                if (!result.success) {
                    const issue = result.error.issues.find((i) => i.path.includes('actionType'));
                    expect(issue?.message).toBe('Action must be INSERT or REMOVE.');
                }
            },
        );
    });
});
