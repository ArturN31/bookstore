import { faker } from '@faker-js/faker/locale/en_GB';
import { Database } from '@/database.types';
import {
    assertValidRequestedCount,
    normalizeNaturalKey,
    planUniqueCandidates,
} from './candidatePlanning';

type User = Database['public']['Tables']['users']['Row'];

export interface MockUserSetup extends Omit<User, 'id' | 'created_at' | 'updated_at'> {
    readonly email: string;
    readonly password: string;
    readonly role: string;
}

export const userEmailNaturalKey = (email: string): string =>
    `email:${normalizeNaturalKey(email)}`;

export const userUsernameNaturalKey = (username: string): string =>
    `username:${normalizeNaturalKey(username)}`;

const MAX_CANDIDATE_ATTEMPTS_PER_RECORD = 10;

const generateUserCandidate = (index: number): MockUserSetup => {
    const isFirst = index === 0;

    return {
        email: isFirst ? 'admin@dev.com' : faker.internet.email().toLowerCase(),
        password: 'Password123!',
        role: isFirst ? 'admin' : 'authenticated',
        username: isFirst ? 'admin' : `user_${faker.string.alphanumeric(5)}`,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        date_of_birth: faker.date
            .birthdate({ min: 18, max: 65, mode: 'age' })
            .toISOString()
            .split('T')[0],
        street_address: faker.location.streetAddress(),
        postcode: faker.location.zipCode(),
        city: faker.location.city(),
        country: 'United Kingdom',
        phone_number: faker.phone.number(),
        is_wishlist_public: false,
        wishlist_share_token: null,
        are_reviews_public: false,
        is_profile_public: false,
        stripe_customer_id: null,
    };
};

export const generateMockUsersArray = (
    count: number = 10,
    existingKeys: Iterable<string> = [],
): MockUserSetup[] => {
    assertValidRequestedCount(count);

    return planUniqueCandidates(
        Array.from(
            { length: count * MAX_CANDIDATE_ATTEMPTS_PER_RECORD },
            (_, index) => generateUserCandidate(index),
        ),
        count,
        (user) => [userEmailNaturalKey(user.email), userUsernameNaturalKey(user.username)],
        existingKeys,
    );
};
