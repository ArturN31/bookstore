import { PAYMENT_METHODS } from '@/data/checkout/CheckoutConstants';
import {
    applyDiscountSchema,
    checkoutFormSchema,
    CheckoutFormSchemaValues,
} from '@/data/schemas/checkoutSchema';
import { sanitizeText } from '@/data/schemas/schemaUtils';

jest.mock('@/data/schemas/schemaUtils', () => ({
    sanitizeText: jest.fn((text: string) => text.replace(/<[^>]*>/g, '')),
}));

jest.mock('@/data/schemas/onboardingSchema', () => ({
    addressFields: {
        streetAddress: jest.requireActual('zod').z.string().min(1, 'Street address is required.'),
        city: jest.requireActual('zod').z.string().min(1, 'City is required.'),
        postcode: jest.requireActual('zod').z.string().min(1, 'Postal code is required.'),
        country: jest.requireActual('zod').z.string().min(1, 'Country is required.'),
    },
}));

describe('checkoutSchema', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkoutFormSchema', () => {
        const validFormData: CheckoutFormSchemaValues = {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            phoneNumber: '+1 123 456 7890',
            streetAddress: '123 Main St',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom',
            paymentMethod: PAYMENT_METHODS.CARD,
        };

        it('should successfully validate a complete valid form payload', () => {
            const result = checkoutFormSchema.safeParse(validFormData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.firstName).toBe('Jane');
                expect(result.data.lastName).toBe('Doe');
                expect(result.data.email).toBe('jane.doe@example.com');
            }
        });

        describe('firstName field', () => {
            it('should trim and sanitize HTML/special characters in firstName', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    firstName: '  <b>John</b>  ',
                });

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.firstName).toBe('John');
                }
                expect(sanitizeText).toHaveBeenNthCalledWith(1, '<b>John</b>', expect.anything());
            });

            it('should fail when firstName is less than 2 characters after sanitization', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    firstName: '  A  ',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.firstName).toContain(
                        'First name must be at least 2 characters.',
                    );
                }
            });

            it('should fail when firstName exceeds 50 characters', () => {
                const longName = 'A'.repeat(51);
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    firstName: longName,
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.firstName).toContain(
                        'First name cannot exceed 50 characters.',
                    );
                }
            });

            it('should fail when firstName contains invalid numeric or special characters', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    firstName: 'John123',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.firstName).toContain(
                        'First name contains invalid characters.',
                    );
                }
            });

            it('should allow valid name special characters such as hyphens, apostrophes, and spaces', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    firstName: "Mary-Jane O'Connor Jr.",
                });

                expect(result.success).toBe(true);
            });
        });

        describe('lastName field', () => {
            it('should trim and sanitize lastName', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    lastName: '  <i>Smith</i>  ',
                });

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.lastName).toBe('Smith');
                }
            });

            it('should fail when lastName is less than 2 characters', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    lastName: 'S',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.lastName).toContain(
                        'Last name must be at least 2 characters.',
                    );
                }
            });

            it('should fail when lastName exceeds 50 characters', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    lastName: 'S'.repeat(51),
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.lastName).toContain(
                        'Last name cannot exceed 50 characters.',
                    );
                }
            });

            it('should fail when lastName contains invalid characters', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    lastName: 'Doe@Work',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.lastName).toContain(
                        'Last name contains invalid characters.',
                    );
                }
            });
        });

        describe('email field', () => {
            it('should trim whitespace from email address', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    email: '  user@domain.com  ',
                });

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.email).toBe('user@domain.com');
                }
            });

            it('should fail when email address is empty', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    email: '   ',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.email).toContain(
                        'Email address is required.',
                    );
                }
            });

            it('should fail when email format is invalid', () => {
                const invalidEmails = ['plainaddress', 'user@', '@domain.com', 'user@domain'];

                for (const email of invalidEmails) {
                    const result = checkoutFormSchema.safeParse({
                        ...validFormData,
                        email,
                    });

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.error.flatten().fieldErrors.email).toContain(
                            'Please enter a valid email address.',
                        );
                    }
                }
            });
        });

        describe('phoneNumber field', () => {
            it('should allow valid phone numbers in different international formats', () => {
                const validNumbers = ['+1 123 456 7890', '07123456789', '+44-7123-456789'];

                for (const phoneNumber of validNumbers) {
                    const result = checkoutFormSchema.safeParse({
                        ...validFormData,
                        phoneNumber,
                    });

                    expect(result.success).toBe(true);
                }
            });

            it('should fail when phone number is empty', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    phoneNumber: '   ',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.phoneNumber).toContain(
                        'Phone number is required.',
                    );
                }
            });

            it('should fail when phone number contains invalid characters or length', () => {
                const invalidNumbers = ['123', 'phone123456', '+1 123 456 7890 1234567890123'];

                for (const phoneNumber of invalidNumbers) {
                    const result = checkoutFormSchema.safeParse({
                        ...validFormData,
                        phoneNumber,
                    });

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.error.flatten().fieldErrors.phoneNumber).toContain(
                            'Invalid format. Examples: +1 123 456 7890 or 07123456789',
                        );
                    }
                }
            });
        });

        describe('paymentMethod field', () => {
            it('should accept valid payment methods (card, paypal)', () => {
                const cardResult = checkoutFormSchema.safeParse({
                    ...validFormData,
                    paymentMethod: PAYMENT_METHODS.CARD,
                });
                expect(cardResult.success).toBe(true);

                const paypalResult = checkoutFormSchema.safeParse({
                    ...validFormData,
                    paymentMethod: PAYMENT_METHODS.PAYPAL,
                });
                expect(paypalResult.success).toBe(true);
            });

            it('should fail when paymentMethod is invalid or unsupported', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    paymentMethod: 'crypto',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.paymentMethod).toContain(
                        'Please select a valid payment method.',
                    );
                }
            });
        });

        describe('addressFields integration', () => {
            it('should fail when required address fields are missing', () => {
                const result = checkoutFormSchema.safeParse({
                    ...validFormData,
                    streetAddress: '',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.streetAddress).toContain(
                        'Street address is required.',
                    );
                }
            });
        });
    });

    describe('applyDiscountSchema', () => {
        it('should validate and transform discount code to trimmed uppercase', () => {
            const result = applyDiscountSchema.safeParse({
                code: '  summer20  ',
                subtotal: 50.0,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.code).toBe('SUMMER20');
                expect(result.data.subtotal).toBe(50.0);
            }
        });

        it('should allow hyphens and underscores in discount codes', () => {
            const result = applyDiscountSchema.safeParse({
                code: 'black_friday-2026',
                subtotal: 100.0,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.code).toBe('BLACK_FRIDAY-2026');
            }
        });

        it('should fail when discount code is empty', () => {
            const result = applyDiscountSchema.safeParse({
                code: '   ',
                subtotal: 25.0,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.flatten().fieldErrors.code).toContain(
                    'Discount code cannot be empty.',
                );
            }
        });

        it('should fail when discount code exceeds 30 characters', () => {
            const result = applyDiscountSchema.safeParse({
                code: 'A'.repeat(31),
                subtotal: 25.0,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.flatten().fieldErrors.code).toContain(
                    'Discount code is too long.',
                );
            }
        });

        it('should fail when discount code contains spaces or invalid characters', () => {
            const invalidCodes = ['SAVE 20', 'CODE!', 'DISCOUNT@10'];

            for (const code of invalidCodes) {
                const result = applyDiscountSchema.safeParse({
                    code,
                    subtotal: 25.0,
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.flatten().fieldErrors.code).toContain(
                        'Discount code can only contain alphanumeric characters, hyphens, and underscores.',
                    );
                }
            }
        });

        it('should allow zero subtotal', () => {
            const result = applyDiscountSchema.safeParse({
                code: 'FREE100',
                subtotal: 0,
            });

            expect(result.success).toBe(true);
        });

        it('should fail when subtotal is negative', () => {
            const result = applyDiscountSchema.safeParse({
                code: 'DISCOUNT',
                subtotal: -10,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.flatten().fieldErrors.subtotal).toContain(
                    'Subtotal cannot be negative.',
                );
            }
        });

        it('should fail when subtotal is not a valid number', () => {
            const result = applyDiscountSchema.safeParse({
                code: 'DISCOUNT',
                subtotal: 'not-a-number',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.flatten().fieldErrors.subtotal).toContain(
                    'Subtotal must be a valid number.',
                );
            }
        });
    });
});
