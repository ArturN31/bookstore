import { z } from 'zod';

export const wishlistSchema = z.object({
    bookId: z.uuid({ message: 'Invalid Book ID format.' }),
    actionType: z.enum(['INSERT', 'REMOVE'], {
        error: 'Action must be INSERT or REMOVE.',
    }),
});
