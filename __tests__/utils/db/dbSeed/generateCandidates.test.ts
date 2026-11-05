import { faker } from '@faker-js/faker/locale/en_GB';
import { bookNaturalKey, generateBooksArray } from '@/utils/db/dbSeed/generateBook';
import { discountNaturalKey, generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import {
    generateMockUsersArray,
    userEmailNaturalKey,
    userUsernameNaturalKey,
} from '@/utils/db/dbSeed/generateUsers';

jest.mock('@faker-js/faker/locale/en_GB', () => ({
    faker: {
        book: {
            title: jest.fn(),
            author: jest.fn(),
            genre: jest.fn(),
            publisher: jest.fn(),
            format: jest.fn(),
        },
        color: { rgb: jest.fn() },
        string: { uuid: jest.fn(), alphanumeric: jest.fn() },
        date: {
            past: jest.fn(),
            between: jest.fn(),
            future: jest.fn(),
            birthdate: jest.fn(),
        },
        commerce: { price: jest.fn() },
        lorem: { paragraph: jest.fn() },
        number: { int: jest.fn() },
        helpers: { arrayElement: jest.fn() },
        internet: { email: jest.fn() },
        person: { firstName: jest.fn(), lastName: jest.fn() },
        location: { streetAddress: jest.fn(), zipCode: jest.fn(), city: jest.fn() },
        phone: { number: jest.fn() },
    },
}));

const fixedDate = new Date('2026-01-01T00:00:00.000Z');

const setBookDefaults = () => {
    let bookIndex = 0;
    let idIndex = 0;
    jest.mocked(faker.book.title).mockImplementation(() => `Book ${bookIndex++}`);
    jest.mocked(faker.book.author).mockReturnValue('Author');
    jest.mocked(faker.book.genre).mockReturnValue('Fantasy');
    jest.mocked(faker.book.publisher).mockReturnValue('Publisher');
    jest.mocked(faker.book.format).mockReturnValue('Paperback');
    jest.mocked(faker.color.rgb).mockReturnValue('ffffff');
    jest.mocked(faker.string.uuid).mockImplementation(() => `book-id-${idIndex++}`);
    jest.mocked(faker.date.past).mockReturnValue(fixedDate);
    jest.mocked(faker.date.between).mockReturnValue(fixedDate);
    jest.mocked(faker.commerce.price).mockReturnValue('15.00');
    jest.mocked(faker.lorem.paragraph).mockReturnValue('Description');
    jest.mocked(faker.number.int).mockReturnValue(100);
};

const setDiscountDefaults = () => {
    let idIndex = 0;
    jest.mocked(faker.helpers.arrayElement).mockImplementation((values) => values[0]);
    jest.mocked(faker.string.alphanumeric).mockReturnValue('ABC');
    jest.mocked(faker.number.int).mockReturnValue(10);
    jest.mocked(faker.date.future).mockReturnValue(fixedDate);
    jest.mocked(faker.string.uuid).mockImplementation(() => `discount-id-${idIndex++}`);
};

const setUserDefaults = () => {
    let emailIndex = 0;
    let usernameIndex = 0;
    jest.mocked(faker.internet.email).mockImplementation(() => `user-${emailIndex++}@example.com`);
    jest.mocked(faker.string.alphanumeric).mockImplementation(() => `name${usernameIndex++}`);
    jest.mocked(faker.person.firstName).mockReturnValue('First');
    jest.mocked(faker.person.lastName).mockReturnValue('Last');
    jest.mocked(faker.date.birthdate).mockReturnValue(fixedDate);
    jest.mocked(faker.location.streetAddress).mockReturnValue('1 Main Street');
    jest.mocked(faker.location.zipCode).mockReturnValue('AB1 2CD');
    jest.mocked(faker.location.city).mockReturnValue('London');
    jest.mocked(faker.phone.number).mockReturnValue('0123456789');
};

describe('book candidate generation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setBookDefaults();
    });

    it('filters stored and batch-internal normalized natural-key collisions', () => {
        const titles = ['Stored Book', 'New Book', ' new   book ', 'Another Book'];
        jest.mocked(faker.book.title).mockImplementation(() => titles.shift() ?? 'Fallback');
        const existingKey = bookNaturalKey({ title: ' stored book ', author: 'Author' });

        const books = generateBooksArray(2, [existingKey]);

        expect(books).toHaveLength(2);
        expect(books.map(bookNaturalKey)).toEqual([
            bookNaturalKey({ title: 'New Book', author: 'Author' }),
            bookNaturalKey({ title: 'Another Book', author: 'Author' }),
        ]);
    });

    it('fails with exact available capacity when bounded candidates collide', () => {
        jest.mocked(faker.book.title).mockReturnValue('Same Book');

        expect(() =>
            generateBooksArray(1, [bookNaturalKey({ title: 'Same Book', author: 'Author' })]),
        ).toThrow(expect.objectContaining({ requestedCount: 1, availableCount: 0 }));
        expect(faker.book.title).toHaveBeenCalledTimes(10);
    });

    it('avoids collisions on a repeated run when supplied the first run keys', () => {
        const titles = ['Repeat Book', 'Fresh Book'];
        jest.mocked(faker.book.title).mockImplementation(() => titles.shift() ?? 'Fresh Book');
        const firstRun = generateBooksArray(1);

        const repeatedTitles = ['Repeat Book', 'Fresh Book'];
        jest.mocked(faker.book.title).mockImplementation(
            () => repeatedTitles.shift() ?? 'Fresh Book',
        );
        const secondRun = generateBooksArray(1, firstRun.map(bookNaturalKey));

        expect(bookNaturalKey(secondRun[0])).not.toBe(bookNaturalKey(firstRun[0]));
    });
});

describe('discount candidate generation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setDiscountDefaults();
    });

    it('filters stored and batch-internal normalized code collisions', () => {
        const suffixes = ['ABC', 'ABC', 'DEF'];
        jest.mocked(faker.string.alphanumeric).mockImplementation(() => suffixes.shift() ?? 'GHI');

        const discounts = generateDiscounts(2, [discountNaturalKey('save_abc')]);

        expect(discounts).toHaveLength(2);
        expect(discounts.map(({ code }) => code)).toEqual(['SAVE_DEF', 'SAVE_GHI']);
    });

    it('fails with exact available capacity when bounded candidates collide', () => {
        expect(() => generateDiscounts(1, [discountNaturalKey('SAVE_ABC')])).toThrow(
            expect.objectContaining({ requestedCount: 1, availableCount: 0 }),
        );
        expect(faker.string.alphanumeric).toHaveBeenCalledTimes(10);
    });

    it('avoids collisions on a repeated run when supplied the first run keys', () => {
        const suffixes = ['ABC', 'DEF'];
        jest.mocked(faker.string.alphanumeric).mockImplementation(() => suffixes.shift() ?? 'DEF');
        const firstRun = generateDiscounts(1);

        const repeatedSuffixes = ['ABC', 'DEF'];
        jest.mocked(faker.string.alphanumeric).mockImplementation(
            () => repeatedSuffixes.shift() ?? 'DEF',
        );
        const secondRun = generateDiscounts(
            1,
            firstRun.map(({ code }) => discountNaturalKey(code)),
        );

        expect(secondRun[0].code).not.toBe(firstRun[0].code);
    });
});

describe('user candidate generation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setUserDefaults();
    });

    it('rejects candidates colliding independently on stored email and username', () => {
        const emails = ['taken@example.com', 'other@example.com', 'fresh@example.com'];
        const usernames = ['taken', 'taken', 'fresh'];
        jest.mocked(faker.internet.email).mockImplementation(
            () => emails.shift() ?? 'fallback@example.com',
        );
        jest.mocked(faker.string.alphanumeric).mockImplementation(
            () => usernames.shift() ?? 'fallback',
        );

        const users = generateMockUsersArray(1, [
            userEmailNaturalKey('admin@dev.com'),
            userUsernameNaturalKey('admin'),
            userEmailNaturalKey('taken@example.com'),
            userUsernameNaturalKey('user_taken'),
        ]);

        expect(users).toHaveLength(1);
        expect(users[0]).toMatchObject({
            email: 'fresh@example.com',
            username: 'user_fresh',
        });
    });

    it('keeps independently unique email and username keys within a batch', () => {
        const users = generateMockUsersArray(10);

        expect(users).toHaveLength(10);
        expect(new Set(users.map(({ email }) => userEmailNaturalKey(email))).size).toBe(10);
        expect(new Set(users.map(({ username }) => userUsernameNaturalKey(username))).size).toBe(
            10,
        );
    });

    it('avoids email and username collisions on a repeated run', () => {
        const firstRun = generateMockUsersArray(2);
        const existingKeys = firstRun.flatMap(({ email, username }) => [
            userEmailNaturalKey(email),
            userUsernameNaturalKey(username),
        ]);

        setUserDefaults();
        const secondRun = generateMockUsersArray(2, existingKeys);

        const firstEmails = new Set(firstRun.map(({ email }) => userEmailNaturalKey(email)));
        const firstUsernames = new Set(
            firstRun.map(({ username }) => userUsernameNaturalKey(username)),
        );
        expect(secondRun.every(({ email }) => !firstEmails.has(userEmailNaturalKey(email)))).toBe(
            true,
        );
        expect(
            secondRun.every(
                ({ username }) => !firstUsernames.has(userUsernameNaturalKey(username)),
            ),
        ).toBe(true);
    });

    it('fails with exact available capacity when bounded candidates collide', () => {
        jest.mocked(faker.internet.email).mockReturnValue('same@example.com');
        jest.mocked(faker.string.alphanumeric).mockReturnValue('same');

        expect(() =>
            generateMockUsersArray(1, [
                userEmailNaturalKey('admin@dev.com'),
                userUsernameNaturalKey('admin'),
                userEmailNaturalKey('same@example.com'),
                userUsernameNaturalKey('user_same'),
            ]),
        ).toThrow(expect.objectContaining({ requestedCount: 1, availableCount: 0 }));
        expect(faker.internet.email).toHaveBeenCalledTimes(9);
    });
});
