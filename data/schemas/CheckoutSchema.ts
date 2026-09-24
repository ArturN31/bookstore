import { z } from 'zod';
import { PAYMENT_METHODS } from '../checkout/CheckoutConstants';
import { addressFields } from './onboardingSchema';
import { sanitizeText } from './schemaUtils';

const paymentMethodValues = [PAYMENT_METHODS.CARD, PAYMENT_METHODS.PAYPAL] as const;

export const checkoutFormSchema = z.object({
    firstName: z
        .string()
        .trim()
        .transform(sanitizeText)
        .pipe(
            z
                .string()
                .min(2, 'First name must be at least 2 characters.')
                .max(50, 'First name cannot exceed 50 characters.')
                .regex(/^[a-zA-Z\s\-'.]+$/, 'First name contains invalid characters.'),
        ),
    lastName: z
        .string()
        .trim()
        .transform(sanitizeText)
        .pipe(
            z
                .string()
                .min(2, 'Last name must be at least 2 characters.')
                .max(50, 'Last name cannot exceed 50 characters.')
                .regex(/^[a-zA-Z\s\-'.]+$/, 'Last name contains invalid characters.'),
        ),
    email: z
        .string()
        .trim()
        .min(1, 'Email address is required.')
        .pipe(z.email('Please enter a valid email address.')),
    phoneNumber: z
        .string()
        .trim()
        .min(1, 'Phone number is required.')
        .regex(/^\+?[0-9\s-]{7,20}$/, 'Invalid format. Examples: +1 123 456 7890 or 07123456789'),
    ...addressFields,
    paymentMethod: z.enum(paymentMethodValues, {
        message: 'Please select a valid payment method.',
    }),
});

export type CheckoutFormSchemaValues = z.infer<typeof checkoutFormSchema>;

export const applyDiscountSchema = z.object({
    code: z
        .string()
        .trim()
        .toUpperCase()
        .min(1, 'Discount code cannot be empty.')
        .max(30, 'Discount code is too long.')
        .regex(
            /^[A-Z0-9_-]+$/,
            'Discount code can only contain alphanumeric characters, hyphens, and underscores.',
        ),
    subtotal: z
        .number({ message: 'Subtotal must be a valid number.' })
        .nonnegative('Subtotal cannot be negative.'),
});

export type ApplyDiscountSchemaValues = z.infer<typeof applyDiscountSchema>;
