import { faker } from '@faker-js/faker/locale/en_GB';
import { testUserIds } from '@/utils/db/dbSeed/generateReview';
import { Database } from '@/database.types';

type BookDB = Database['public']['Tables']['books']['Row'];
type DiscountDB = Database['public']['Tables']['discounts']['Row'];
type OrderDB = Database['public']['Tables']['orders']['Row'];
type OrderItemDB = Database['public']['Tables']['order_items']['Row'];
type OrderDiscountDB = Database['public']['Tables']['order_discounts']['Row'];

const PAYMENT_METHODS: readonly string[] = [
    'Credit Card',
    'Debit Card',
    'PayPal',
    'Apple Pay',
    'Google Pay',
    'Stripe',
];

const calculateDiscountAmount = (subtotal: number, discount: DiscountDB): number => {
    const value = Number(discount.value);
    if (discount.type === 'percentage') return Math.round(((subtotal * value) / 100) * 100) / 100;
    if (discount.type === 'fixed_amount' || discount.type === 'fixed')
        return Math.min(subtotal, value);
    return 0;
};

const generateLineItems = (orderID: string, books: readonly BookDB[], count: number) => {
    const items: OrderItemDB[] = [];
    let subtotal = 0;

    for (let i = 0; i < count; i++) {
        const book = faker.helpers.arrayElement(books);
        if (!book || !book.id) continue;

        const quantity = faker.number.int({ min: 1, max: 2 });
        const unitPrice = parseFloat(book.price.toString().replace(/[£,]/g, ''));

        items.push({
            id: faker.string.uuid(),
            created_at: new Date().toISOString(),
            order_id: orderID,
            book_id: book.id,
            quantity,
            price: unitPrice,
        });

        subtotal += unitPrice * quantity;
    }

    return { items, subtotal };
};

export const generateOrdersAndItems = (
    books: readonly BookDB[],
    ordersAmount: number,
    itemsAmount: number,
    discounts: readonly DiscountDB[],
    discountsAmount: number,
) => {
    const orders: OrderDB[] = [];
    const allItems: OrderItemDB[] = [];
    const orderDiscounts: OrderDiscountDB[] = [];

    const baseItemsPerOrder = Math.floor(itemsAmount / ordersAmount);
    let extraItems = itemsAmount % ordersAmount;
    let remainingDiscounts = Math.min(discountsAmount, ordersAmount);

    for (let i = 0; i < ordersAmount; i++) {
        const orderID = faker.string.uuid();
        const currentOrderItemsCount = baseItemsPerOrder + (extraItems > 0 ? 1 : 0);
        if (extraItems > 0) extraItems--;

        const { items, subtotal } = generateLineItems(orderID, books, currentOrderItemsCount);
        allItems.push(...items);

        let discountAmount = 0;
        if (remainingDiscounts > 0 && discounts.length > 0) {
            const discount = faker.helpers.arrayElement(discounts);
            if (discount && discount.id) {
                orderDiscounts.push({
                    id: faker.string.uuid(),
                    order_id: orderID,
                    discount_id: discount.id,
                });
                discountAmount = calculateDiscountAmount(subtotal, discount);
                remainingDiscounts--;
            }
        }

        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
        const shippingCost = 2.99;
        const taxAmount = 0;
        const finalTotal =
            Math.round((subtotalAfterDiscount + shippingCost + taxAmount) * 100) / 100;

        orders.push({
            id: orderID,
            user_id: faker.helpers.arrayElement(testUserIds),
            subtotal: Number(subtotal.toFixed(2)),
            discount_amount: Number(discountAmount.toFixed(2)),
            shipping_cost: Number(shippingCost.toFixed(2)),
            tax_amount: Number(taxAmount.toFixed(2)),
            total_amount: Number(finalTotal.toFixed(2)),
            shipping_method_id: 'royal_mail_standard',
            shipping_method_name: 'Royal Mail Standard',
            status: faker.helpers.arrayElement(['pending', 'completed', 'cancelled', 'shipped']),
            payment_method: faker.helpers.arrayElement(PAYMENT_METHODS),
            created_at: faker.date.recent({ days: 30 }).toISOString(),
            stripe_checkout_session_id: null,
            stripe_payment_intent_id: `pi_${faker.string.alphanumeric(24)}`,
        });
    }

    return { orders, items: allItems, orderDiscounts };
};
