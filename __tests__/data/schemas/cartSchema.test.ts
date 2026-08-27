import { cartSchema } from '@/data/schemas/cartSchema';

describe('cartSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    describe('bookId validation', () => {
        it('should pass with a valid UUID', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: 1,
                actionType: 'INSERT',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookId).toBe(validUuid);
            }
        });

        it('should trim surrounding whitespace from bookId', () => {
            const payload = {
                bookId: `   ${validUuid}   `,
                bookQuantity: 1,
                actionType: 'INSERT',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookId).toBe(validUuid);
            }
        });

        it('should fail when bookId is an empty string', () => {
            const payload = {
                bookId: '   ',
                bookQuantity: 1,
                actionType: 'INSERT',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('bookId'));
                expect(issue?.message).toBe('Book ID is required');
            }
        });

        it('should fail when bookId is not a valid UUID format', () => {
            const payload = {
                bookId: 'invalid-book-id-123',
                bookQuantity: 1,
                actionType: 'INSERT',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('bookId'));
                expect(issue?.message).toBe('Invalid Book ID format');
            }
        });
    });

    describe('bookQuantity validation and preprocessing', () => {
        it('should accept a valid numeric input', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: 5,
                actionType: 'UPDATE',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookQuantity).toBe(5);
            }
        });

        it('should preprocess a valid integer string into a number', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: ' 10 ',
                actionType: 'UPDATE',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookQuantity).toBe(10);
            }
        });

        it('should default to 1 when bookQuantity is missing or undefined', () => {
            const payload = {
                bookId: validUuid,
                actionType: 'INSERT',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookQuantity).toBe(1);
            }
        });

        it('should default to 1 when bookQuantity is an empty string', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: '  ',
                actionType: 'INSERT',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookQuantity).toBe(1);
            }
        });

        it('should default to 1 when bookQuantity string cannot be parsed to a number', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: 'not-a-number',
                actionType: 'INSERT',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookQuantity).toBe(1);
            }
        });

        it('should pass at the lower boundary constraint of 0', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: 0,
                actionType: 'UPDATE',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookQuantity).toBe(0);
            }
        });

        it('should pass at the upper boundary constraint of 99', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: '99',
                actionType: 'UPDATE',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.bookQuantity).toBe(99);
            }
        });

        it('should fail when quantity is below 0', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: -1,
                actionType: 'UPDATE',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('bookQuantity'));
                expect(issue?.message).toBe('Quantity must be 0 or more');
            }
        });

        it('should fail when quantity exceeds 99', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: 100,
                actionType: 'UPDATE',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('bookQuantity'));
                expect(issue?.message).toBe('Quantity cannot exceed 99');
            }
        });

        it('should fail when numeric input is a non-integer float', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: 3.14,
                actionType: 'UPDATE',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('bookQuantity'));
                expect(issue?.message).toBe('Quantity must be an integer');
            }
        });
    });

    describe('actionType enum validation', () => {
        it.each(['INSERT', 'UPDATE', 'REMOVE'] as const)(
            'should pass for valid actionType: %s',
            (actionType) => {
                const payload = {
                    bookId: validUuid,
                    bookQuantity: 1,
                    actionType,
                };

                const result = cartSchema.safeParse(payload);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.actionType).toBe(actionType);
                }
            },
        );

        it('should fail when actionType is invalid', () => {
            const payload = {
                bookId: validUuid,
                bookQuantity: 1,
                actionType: 'DELETE',
            };

            const result = cartSchema.safeParse(payload);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issue = result.error.issues.find((i) => i.path.includes('actionType'));
                expect(issue?.message).toBe('Action must be INSERT, UPDATE, or REMOVE');
            }
        });
    });
});
