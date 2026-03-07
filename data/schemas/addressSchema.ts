import { z } from 'zod';

export const addressFields = {
    streetAddress: z
        .string()
        .trim()
        .min(5, 'Please enter a full street address (at least 5 characters)')
        .max(100, 'Street address is too long (max 100 characters)'),
    postcode: z
        .string()
        .trim()
        .min(1, 'Postcode is required')
        .regex(/^[A-Za-z0-9\s]{3,10}$/, 'Postcode must be 3-10 alphanumeric characters'),
    city: z.string().trim().min(2, 'City name must be at least 2 characters').max(50),
    country: z.string().trim().min(1, 'Please select a country'),
};

export const addressSchema = z.object(addressFields);

export const fullUserSchema = z.object(addressFields).extend({
    firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
    dob: z
        .string()
        .min(1, 'Date of birth is required')
        .refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Please enter a valid date')
        .refine((val) => {
            const date = new Date(val);
            const today = new Date();
            const age = today.getFullYear() - date.getFullYear();
            return age >= 18;
        }, 'You must be at least 18 years old'),
    phoneNumber: z
        .string()
        .trim()
        .min(1, 'Phone number is required')
        .regex(/^\+?[0-9\s-]{7,20}$/, 'Invalid format. Examples: +1 123 456 7890 or 07123456789'),
});
