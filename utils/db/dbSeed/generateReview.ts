import { faker } from '@faker-js/faker/locale/en_GB';
import {
    assertValidRequestedCount,
    naturalPairKey,
    sampleUniqueCandidates,
} from './candidatePlanning';

export const testUserIds = [
    '6719fac7-fc59-411c-b20c-22ac6c7b622f', //Test User10
    '9a7642c4-8231-44e6-8062-db02643cc373', //Test User9
    'b7de927c-0080-4af6-94ac-1acbf4ffad03', //Test User8
    '3214fb78-41e5-44f2-b070-747c222332b4', //Test User7
    'e21ae8ae-c3a3-4e1c-aaba-37c6e293bc16', //Test User6
    '086d18e5-3370-40dc-83e4-e84a8f8f0eee', //Test User5
    'f12cd62f-e628-45b4-aff1-5030e5031611', //Test User4
    '44b791b0-4ba5-423b-aaed-38293b5c7ae9', //Test User3
    '3d947395-70c1-418f-b969-808c069c4214', //Test User2
    'f679c56a-f208-470e-8161-e7ffd62a4a32', //Test User
];

export const reviewNaturalKey = (userId: string, bookId: string): string =>
    naturalPairKey(userId, bookId);

type ReviewCandidate = {
    book: BookDB & { id: string };
    user: { id: string; username: string };
};

export const generateReviewsArray = (
    books: BookDB[],
    targetCount: number,
    existingUsers: { id: string; username: string }[],
    existingKeys: Iterable<string> = [],
    random: () => number = Math.random,
): ReviewDB[] => {
    assertValidRequestedCount(targetCount);

    const validBooks = [
        ...new Map(
            books
                .filter((book): book is BookDB & { id: string } => Boolean(book.id))
                .map((book) => [book.id, book]),
        ).values(),
    ];
    const validUsers = [
        ...new Map(
            existingUsers
                .filter((user) => Boolean(user.id))
                .map((user) => [user.id, user]),
        ).values(),
    ];

    const selectedPairs = sampleUniqueCandidates(
        validBooks.flatMap((book) => validUsers.map((user) => ({ book, user }))),
        targetCount,
        ({ book, user }) => [reviewNaturalKey(user.id, book.id)],
        existingKeys,
        random,
    );

    return selectedPairs.map(({ book, user }) => {
        const timestamp = faker.date.past({ years: 1 }).toISOString();

        return {
            id: faker.string.uuid(),
            created_at: timestamp,
            updated_at: timestamp,
            book_id: book.id,
            user_id: user.id,
            username: user.username,
            review: faker.lorem.paragraph({ min: 1, max: 3 }),
            rating: Math.floor(Math.random() * 5) + 1,
        };
    });
};
