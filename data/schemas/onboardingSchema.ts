import { z } from 'zod';

const sanitizeText = (val: string): string => val.replace(/<[^>]*>?/gm, '').trim();

export const addressFields = {
    streetAddress: z
        .string()
        .trim()
        .transform(sanitizeText)
        .pipe(
            z
                .string()
                .min(5, 'Please enter a full street address (at least 5 characters)')
                .max(100, 'Street address is too long (max 100 characters)'),
        ),
    postcode: z
        .string()
        .trim()
        .transform((val) => val.toUpperCase())
        .pipe(
            z
                .string()
                .min(1, 'Postcode is required')
                .regex(/^[A-Z0-9\s]{3,10}$/, 'Postcode must be 3-10 alphanumeric characters'),
        ),
    city: z
        .string()
        .trim()
        .transform(sanitizeText)
        .pipe(
            z
                .string()
                .min(2, 'City name must be at least 2 characters')
                .max(50, 'City name cannot exceed 50 characters')
                .regex(/^[a-zA-Z\s\-'.]+$/, 'City name contains invalid characters'),
        ),
    country: z
        .string()
        .trim()
        .transform(sanitizeText)
        .pipe(z.string().min(1, 'Please select a country').max(50, 'Country name is too long')),
};

export const addressSchema = z.object(addressFields);

export const fullUserSchema = z.object(addressFields).extend({
    firstName: z
        .string()
        .trim()
        .transform(sanitizeText)
        .pipe(
            z
                .string()
                .min(2, 'First name must be at least 2 characters')
                .max(50, 'First name cannot exceed 50 characters')
                .regex(/^[a-zA-Z\s\-'.]+$/, 'First name contains invalid characters'),
        ),
    lastName: z
        .string()
        .trim()
        .transform(sanitizeText)
        .pipe(
            z
                .string()
                .min(2, 'Last name must be at least 2 characters')
                .max(50, 'Last name cannot exceed 50 characters')
                .regex(/^[a-zA-Z\s\-'.]+$/, 'Last name contains invalid characters'),
        ),
    username: z
        .string()
        .trim()
        .transform((val) => val.toLowerCase())
        .pipe(
            z
                .string()
                .min(3, 'Username must be at least 3 characters long')
                .max(50, 'Username cannot be longer than 50 characters')
                .regex(
                    /^[a-zA-Z0-9_]+$/,
                    'Username can only contain letters, numbers, and underscores',
                ),
        ),
    dob: z
        .string()
        .trim()
        .min(1, 'Date of birth is required')
        .refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Please enter a valid date')
        .refine((val) => {
            const date = new Date(val);
            const today = new Date();
            return date <= today;
        }, 'Date of birth cannot be in the future')
        .refine((val) => {
            const date = new Date(val);
            const today = new Date();
            let age = today.getFullYear() - date.getFullYear();
            const monthDiff = today.getMonth() - date.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
                age--;
            }
            return age >= 18;
        }, 'You must be at least 18 years old')
        .refine((val) => {
            const date = new Date(val);
            const today = new Date();
            const age = today.getFullYear() - date.getFullYear();
            return age <= 120;
        }, 'Please enter a valid birth year'),
    phoneNumber: z
        .string()
        .trim()
        .min(1, 'Phone number is required')
        .regex(/^\+?[0-9\s-]{7,20}$/, 'Invalid format. Examples: +1 123 456 7890 or 07123456789'),
});
