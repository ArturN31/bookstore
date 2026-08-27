import { z } from 'zod';

export const wishlistSchema = z.object({
    bookId: z.string().trim().min(1, 'Book ID is required').pipe(z.uuid('Invalid Book ID format.')),
    actionType: z.enum(['INSERT', 'REMOVE'], {
        message: 'Action must be INSERT or REMOVE.',
    }),
});
