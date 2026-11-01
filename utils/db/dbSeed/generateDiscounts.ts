import { faker } from '@faker-js/faker/locale/en_GB';
import {
    assertValidRequestedCount,
    normalizeNaturalKey,
    planUniqueCandidates,
} from './candidatePlanning';

type GeneratedDiscount = {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    is_active: true;
    end_date: string;
};

export const discountNaturalKey = (code: string): string => normalizeNaturalKey(code);

const MAX_CANDIDATE_ATTEMPTS_PER_RECORD = 10;

const generateDiscount = (): GeneratedDiscount => {
    const isPercentage = Math.random() > 0.5;
    const prefix = faker.helpers.arrayElement(['SAVE', 'OFFER', 'PROMO', 'BOOK', 'READ']);
    const suffix = faker.string.alphanumeric(3).toUpperCase();

    return {
        code: `${prefix}_${suffix}`,
        type: isPercentage ? 'percentage' : 'fixed',
        value: isPercentage
            ? faker.number.int({ min: 5, max: 50 })
            : faker.number.int({ min: 5, max: 20 }),
        is_active: true,
        end_date: faker.date.future({ years: 1 }).toISOString(),
    };
};

export const generateDiscounts = (
    amount: number = 5,
    existingKeys: Iterable<string> = [],
): GeneratedDiscount[] => {
    assertValidRequestedCount(amount);

    return planUniqueCandidates(
        Array.from({ length: amount * MAX_CANDIDATE_ATTEMPTS_PER_RECORD }, generateDiscount),
        amount,
        (discount) => [discountNaturalKey(discount.code)],
        existingKeys,
    );
};
