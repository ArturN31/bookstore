import { faker } from '@faker-js/faker/locale/en_GB';

export interface MockUserSetup extends Omit<User, 'id' | 'created_at' | 'updated_at'> {
    password: string;
    role: string;
}

export const generateMockUsersArray = (count: number = 10): MockUserSetup[] => {
    return Array.from({ length: count }, (_, i) => {
        const isFirst = i === 0;

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
        };
    });
};
