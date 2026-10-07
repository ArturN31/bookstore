export const FREE_SHIPPING_THRESHOLD = 50.0;

export const DEFAULT_CURRENCY = 'GBP';

export const SHIPPING_ZONES = {
    ZONE_1: { id: 'zone_1', name: 'Glasgow & Surroundings', prefixes: ['G'] },
    ZONE_2: { id: 'zone_2', name: 'Central Scotland', prefixes: ['PA', 'ML', 'FK', 'EH', 'KA'] },
    ZONE_3: { id: 'zone_3', name: 'Rest of UK', prefixes: [] },
} as const;

export interface ShippingMethodOption {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly estimatedDelivery: string;
    readonly isExpress: boolean;
    readonly isCollect: boolean;
    readonly baseCosts: {
        readonly zone_1: number;
        readonly zone_2: number;
        readonly zone_3: number;
    };
}

export const SHIPPING_METHODS: readonly ShippingMethodOption[] = [
    {
        id: 'royal_mail_standard',
        name: 'Royal Mail Standard',
        description: 'Reliable standard delivery across the UK',
        estimatedDelivery: '2 - 3 Working Days',
        isExpress: false,
        isCollect: false,
        baseCosts: { zone_1: 2.99, zone_2: 4.99, zone_3: 7.99 },
    },
    {
        id: 'courier_express',
        name: 'Courier Express',
        description: 'Priority handling with real-time tracking',
        estimatedDelivery: 'Next Working Day',
        isExpress: true,
        isCollect: false,
        baseCosts: { zone_1: 5.99, zone_2: 8.99, zone_3: 12.99 },
    },
    {
        id: 'click_and_collect',
        name: 'In-Store Collection',
        description: 'Pick up directly from our Glasgow Hub',
        estimatedDelivery: 'Ready in 2 Hours',
        isExpress: false,
        isCollect: true,
        baseCosts: { zone_1: 0.0, zone_2: 0.0, zone_3: 0.0 },
    },
] as const;

export const DEFAULT_SHIPPING_METHOD_ID = 'royal_mail_standard';

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
