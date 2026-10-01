/**
 * @jest-environment node
 */

import { loadStripe } from '@stripe/stripe-js';

jest.mock('@stripe/stripe-js', () => ({
    loadStripe: jest.fn().mockImplementation(() => Promise.resolve({})),
}));

describe('getStripeHeader', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        // Simulate browser environment by default in Node environment
        global.window = {} as unknown as Window & typeof globalThis;
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
        // @ts-expect-error - clean up simulated window property
        delete global.window;
    });

    it('returns null when window is undefined (SSR check)', async () => {
        // @ts-expect-error - remove window to simulate SSR in Node
        delete global.window;
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_12345';

        const { getStripeHeader } = await import('@/data/checkout/CheckoutStripeClient');
        const result = await getStripeHeader();

        expect(result).toBeNull();
    });

    it('returns null and logs error when publishable key is missing', async () => {
        delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { getStripeHeader } = await import('@/data/checkout/CheckoutStripeClient');
        const result = await getStripeHeader();

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
            '[Stripe Error] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing or invalid.',
        );
        consoleSpy.mockRestore();
    });

    it('returns null and logs error when publishable key does not start with pk_', async () => {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'invalid_key_123';
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { getStripeHeader } = await import('@/data/checkout/CheckoutStripeClient');
        const result = await getStripeHeader();

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
            '[Stripe Error] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing or invalid.',
        );
        consoleSpy.mockRestore();
    });

    it('handles loadStripe rejection (catch branch), resets cache, and returns null', async () => {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_12345';
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const { loadStripe: currentLoadStripe } = await import('@stripe/stripe-js');
        const mockLoadStripe = jest.mocked(currentLoadStripe);
        mockLoadStripe.mockRejectedValueOnce(new Error('SDK load failure'));

        const { getStripeHeader } = await import('@/data/checkout/CheckoutStripeClient');
        const result = await getStripeHeader();

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
            '[Stripe Error] Failed to load Stripe.js SDK script:',
            expect.any(Error),
        );
        consoleSpy.mockRestore();
    });

    it('successfully loads stripe and caches the promise when a valid key is provided', async () => {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_12345';
        const mockStripeInstance = { payments: {} };

        const { loadStripe: currentLoadStripe } = await import('@stripe/stripe-js');
        const mockLoadStripe = jest.mocked(currentLoadStripe);
        mockLoadStripe.mockResolvedValueOnce(
            mockStripeInstance as unknown as ReturnType<typeof loadStripe>,
        );

        const { getStripeHeader } = await import('@/data/checkout/CheckoutStripeClient');
        const result = await getStripeHeader();

        expect(result).toEqual(mockStripeInstance);
        expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_12345');

        const cachedResult = await getStripeHeader();
        expect(cachedResult).toEqual(mockStripeInstance);
        expect(mockLoadStripe).toHaveBeenCalledTimes(1);
    });

    it('strips surrounding quotes from raw environment variables before calling loadStripe', async () => {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = '"pk_test_quoted_key"';
        const mockStripeInstance = { payments: {} };

        const { loadStripe: currentLoadStripe } = await import('@stripe/stripe-js');
        const mockLoadStripe = jest.mocked(currentLoadStripe);
        mockLoadStripe.mockResolvedValueOnce(
            mockStripeInstance as unknown as ReturnType<typeof loadStripe>,
        );

        const { getStripeHeader } = await import('@/data/checkout/CheckoutStripeClient');
        const result = await getStripeHeader();

        expect(result).toEqual(mockStripeInstance);
        expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_quoted_key');
    });
});
