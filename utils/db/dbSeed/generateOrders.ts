import { faker } from '@faker-js/faker/locale/en_GB';
import { testUserIds } from '@/utils/db/dbSeed/generateReview';

const PAYMENT_METHODS: PaymentMethod[] = [
    'Credit Card',
    'Debit Card',
    'PayPal',
    'Apple Pay',
    'Google Pay',
    'Stripe',
];

const applyDiscount = (subtotal: number, discount: DiscountDB): number => {
    if (discount.type === 'percentage') {
        return subtotal * (1 - discount.value / 100);
    }
    if (discount.type === 'fixed') {
        return Math.max(0, subtotal - discount.value);
    }
    return subtotal;
};

const generateLineItems = (orderID: string, books: BookDB[], count: number) => {
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
    books: BookDB[],
    ordersAmount: number,
    itemsAmount: number,
    discounts: DiscountDB[],
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

        let finalTotal = subtotal;

        if (remainingDiscounts > 0 && discounts.length > 0) {
            const discount = faker.helpers.arrayElement(discounts);
            if (discount.id) {
                orderDiscounts.push({
                    id: faker.string.uuid(),
                    order_id: orderID,
                    discount_id: discount.id,
                });
                finalTotal = applyDiscount(subtotal, discount);
                remainingDiscounts--;
            }
        }

        orders.push({
            id: orderID,
            user_id: faker.helpers.arrayElement(testUserIds),
            total_amount: Number(finalTotal.toFixed(2)),
            status: faker.helpers.arrayElement(['pending', 'completed', 'cancelled', 'shipped']),
            payment_method: faker.helpers.arrayElement(PAYMENT_METHODS),
            created_at: faker.date.recent({ days: 30 }).toISOString(),
        });
    }

    return { orders, items: allItems, orderDiscounts };
};
