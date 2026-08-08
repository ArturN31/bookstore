import z from 'zod';

export const USERNAME_SCHEMA = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username cannot be longer than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim(),
});
