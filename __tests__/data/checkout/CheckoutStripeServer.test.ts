/**
 * @jest-environment node
 */

const mockPaymentIntentsCreate = jest.fn();
const mockOnFunction = jest.fn();

const mockStripeConstructor = jest.fn().mockImplementation(() => ({
    paymentIntents: {
        create: mockPaymentIntentsCreate,
    },
    VERSION: '14.0.0',
    on: mockOnFunction,
}));

jest.mock('server-only', () => ({}));

jest.mock('stripe', () => {
    return {
        __esModule: true,
        default: jest
            .fn()
            .mockImplementation((...args: unknown[]) => mockStripeConstructor(...args)),
    };
});

describe('CheckoutStripeServer', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('getStripe', () => {
        it('should throw an error if STRIPE_SECRET_KEY environment variable is missing', async () => {
            delete process.env.STRIPE_SECRET_KEY;

            const { getStripe } = await import('@/data/checkout/CheckoutStripeServer');

            expect(() => getStripe()).toThrow('Missing STRIPE_SECRET_KEY environment variable.');
        });

        it('should initialize and return a Stripe singleton instance when key is present', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

            const { getStripe } = await import('@/data/checkout/CheckoutStripeServer');

            const client1 = getStripe();
            const client2 = getStripe();

            expect(client1).toBeDefined();
            expect(client1).toBe(client2);
            expect(mockStripeConstructor).toHaveBeenCalledTimes(1);
            expect(mockStripeConstructor).toHaveBeenCalledWith('sk_test_valid_key');
        });
    });

    describe('stripe proxy', () => {
        it('should return nested object properties from the Stripe client directly (hitting the false branch)', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';
            mockPaymentIntentsCreate.mockResolvedValueOnce({ id: 'pi_mock_123' });

            const { stripe } = await import('@/data/checkout/CheckoutStripeServer');

            const result = await stripe.paymentIntents.create({
                amount: 1000,
                currency: 'gbp',
            });

            expect(result).toEqual({ id: 'pi_mock_123' });
            expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
                amount: 1000,
                currency: 'gbp',
            });
        });

        it('should return non-function properties from the Stripe client directly', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

            const { stripe } = await import('@/data/checkout/CheckoutStripeServer');

            expect((stripe as unknown as { VERSION: string }).VERSION).toBe('14.0.0');
        });

        it('should bind top-level function properties to the Stripe client (hitting the true branch)', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

            const { stripe } = await import('@/data/checkout/CheckoutStripeServer');

            // Accessing 'on' will hit the typeof value === 'function' branch
            const boundOnFunction = (stripe as unknown as { on: () => void }).on;

            // Execute the bound function to verify it proxies properly
            boundOnFunction();

            expect(mockOnFunction).toHaveBeenCalled();
        });
    });

    describe('createPaymentIntentAction', () => {
        it('should successfully create a payment intent with all parameters provided', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

            const mockPaymentIntent = {
                id: 'pi_success_123',
                client_secret: 'pi_success_123_secret_abc',
            };
            mockPaymentIntentsCreate.mockResolvedValueOnce(mockPaymentIntent);

            const { createPaymentIntentAction } =
                await import('@/data/checkout/CheckoutStripeServer');

            const result = await createPaymentIntentAction(
                4599,
                'idempotency_key_123',
                'USD',
                { userId: 'user-123' },
                'cus_stripe_789',
            );

            expect(result).toEqual({
                success: true,
                clientSecret: 'pi_success_123_secret_abc',
                paymentIntentId: 'pi_success_123',
                error: null,
            });

            expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
                {
                    amount: 4599,
                    currency: 'usd',
                    customer: 'cus_stripe_789',
                    automatic_payment_methods: { enabled: true },
                    metadata: { userId: 'user-123' },
                },
                { idempotencyKey: 'idempotency_key_123' },
            );
        });

        it('should use default currency, null customerId, and empty metadata when omitted', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

            const mockPaymentIntent = {
                id: 'pi_default_123',
                client_secret: 'pi_default_123_secret_xyz',
            };
            mockPaymentIntentsCreate.mockResolvedValueOnce(mockPaymentIntent);

            const { createPaymentIntentAction } =
                await import('@/data/checkout/CheckoutStripeServer');

            const result = await createPaymentIntentAction(2000, 'idempotency_key_456');

            expect(result).toEqual({
                success: true,
                clientSecret: 'pi_default_123_secret_xyz',
                paymentIntentId: 'pi_default_123',
                error: null,
            });

            expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
                {
                    amount: 2000,
                    currency: 'gbp',
                    customer: undefined,
                    automatic_payment_methods: { enabled: true },
                    metadata: {},
                },
                { idempotencyKey: 'idempotency_key_456' },
            );
        });

        it('should handle Stripe API Error instances and return failure result', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

            mockPaymentIntentsCreate.mockRejectedValueOnce(
                new Error('Your card has insufficient funds.'),
            );

            const { createPaymentIntentAction } =
                await import('@/data/checkout/CheckoutStripeServer');

            const result = await createPaymentIntentAction(5000, 'idempotency_key_err');

            expect(result).toEqual({
                success: false,
                clientSecret: null,
                paymentIntentId: null,
                error: 'Your card has insufficient funds.',
            });
        });

        it('should handle non-Error exceptions and return default error message', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_valid_key';

            mockPaymentIntentsCreate.mockRejectedValueOnce('Unknown network error string');

            const { createPaymentIntentAction } =
                await import('@/data/checkout/CheckoutStripeServer');

            const result = await createPaymentIntentAction(5000, 'idempotency_key_unknown');

            expect(result).toEqual({
                success: false,
                clientSecret: null,
                paymentIntentId: null,
                error: 'Failed to initialize payment gateway.',
            });
        });

        it('should catch missing environment variable error gracefully when createPaymentIntentAction is called', async () => {
            delete process.env.STRIPE_SECRET_KEY;

            const { createPaymentIntentAction } =
                await import('@/data/checkout/CheckoutStripeServer');

            const result = await createPaymentIntentAction(3000, 'idempotency_key_no_key');

            expect(result).toEqual({
                success: false,
                clientSecret: null,
                paymentIntentId: null,
                error: 'Missing STRIPE_SECRET_KEY environment variable.',
            });
        });
    });
});
