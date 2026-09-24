export const SHIPPING_COST = 5.99;

export const FREE_SHIPPING_THRESHOLD = 50.0;

export const DEFAULT_CURRENCY = 'GBP';

// TODO: Add STRIPE_API_VERSION constant (e.g., '2025-08-27.acacia' or latest) for initializing Stripe SDK instance.
export const PAYMENT_METHODS = {
    CARD: 'card',
    PAYPAL: 'paypal',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const ORDER_STATUSES = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    SHIPPED: 'shipped',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const RATE_LIMIT_PREVENTIONS = {
    MAX_DISCOUNT_ATTEMPTS_PER_MIN: 5,
    MAX_CHECKOUT_ATTEMPTS_PER_MIN: 3,
} as const;

export const SANDBOX_BANNER_MESSAGE =
    'Test Mode Enabled: Use Stripe test card numbers (e.g., 4242 4242 4242 4242) for processing.';
