import { z } from 'zod';

export const cartSchema = z.object({
    bookId: z.string().min(1, 'Book ID is required'),
    bookQuantity: z.preprocess(
        (val) => parseInt(val as string, 10),
        z.number().min(0, 'Quantity must be 0 or more').default(1),
    ),
    actionType: z.enum(['INSERT', 'UPDATE', 'REMOVE']),
});
