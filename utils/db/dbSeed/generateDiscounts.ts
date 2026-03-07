import { faker } from '@faker-js/faker/locale/en_GB';

export const generateDiscounts = (amount: number = 5) => {
    const discounts = [];

    for (let i = 0; i < amount; i++) {
        const isPercentage = Math.random() > 0.5;

        const prefix = faker.helpers.arrayElement(['SAVE', 'OFFER', 'PROMO', 'BOOK', 'READ']);
        const suffix = faker.string.alphanumeric(3).toUpperCase();
        const code = `${prefix}_${suffix}`;

        discounts.push({
            code,
            type: isPercentage ? 'percentage' : 'fixed',
            value: isPercentage
                ? faker.number.int({ min: 5, max: 50 })
                : faker.number.int({ min: 5, max: 20 }),
            is_active: true,
            end_date: faker.date.future({ years: 1 }).toISOString(),
        });
    }

    return discounts;
};
