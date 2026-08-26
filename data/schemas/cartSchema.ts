import { z } from 'zod';

export const cartSchema = z.object({
    bookId: z.string().trim().min(1, 'Book ID is required').pipe(z.uuid('Invalid Book ID format')),
    bookQuantity: z.preprocess((val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string' && val.trim() !== '') {
            const parsed = parseInt(val.trim(), 10);
            return isNaN(parsed) ? undefined : parsed;
        }
        return undefined;
    }, z.number().int('Quantity must be an integer').min(0, 'Quantity must be 0 or more').max(99, 'Quantity cannot exceed 99').default(1)),
    actionType: z.enum(['INSERT', 'UPDATE', 'REMOVE'], {
        message: 'Action must be INSERT, UPDATE, or REMOVE',
    }),
});
