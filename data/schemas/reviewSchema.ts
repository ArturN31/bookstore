import { z } from 'zod';

export const reviewSchema = z.object({
    rating: z
        .string()
        .min(1, 'Please select a rating')
        .refine((val) => {
            const num = Number(val);
            return !isNaN(num) && num >= 1 && num <= 5;
        }, 'Rating must be between 1 and 5 stars'),
    review: z
        .string()
        .min(3, 'Review comment must be at least 3 characters')
        .max(2000, 'Review comment cannot exceed 2000 characters'),
});

export type ReviewSchemaInput = z.infer<typeof reviewSchema>;
