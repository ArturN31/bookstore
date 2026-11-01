import { faker } from '@faker-js/faker/locale/en_GB';
import { Database } from '@/database.types';
import {
    assertValidRequestedCount,
    naturalPairKey,
    planUniqueCandidates,
} from './candidatePlanning';

type BookDB = Database['public']['Tables']['books']['Row'];

const generateBook = (): BookDB => {
    const title = faker.book.title();
    const currentDate = new Date();
    const randomColour = faker.color.rgb({ prefix: '' }).replace('#', '');

    return {
        id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        updated_at: currentDate.toISOString(),
        title: title,
        author: faker.book.author(),
        genre: faker.book.genre(),
        publisher: faker.book.publisher(),
        publication_date: faker.date.between({ from: '2000-01-01', to: currentDate }).toISOString(),
        price: faker.commerce.price({ min: 10, max: 25 }),
        description: faker.lorem.paragraph({ min: 5, max: 15 }),
        format: faker.book.format(),
        page_count: faker.number.int({ min: 100, max: 600 }),
        image_url: `https://placehold.co/400x400@3x/000000/${randomColour}/jpg?text=${encodeURIComponent(title)}&font=Raleway`,
        stock_quantity: faker.number.int({ min: 10, max: 1000 }),
        is_active: Math.random() < 0.8,
        sales_count: 0,
        stripe_product_id: null,
        stripe_price_id: null,
    };
};

export const bookNaturalKey = (book: Pick<BookDB, 'title' | 'author'>): string =>
    naturalPairKey(book.title, book.author);

const MAX_CANDIDATE_ATTEMPTS_PER_RECORD = 10;

export const generateBooksArray = (
    booksAmount: number,
    existingKeys: Iterable<string> = [],
): BookDB[] => {
    assertValidRequestedCount(booksAmount);

    return planUniqueCandidates(
        Array.from({ length: booksAmount * MAX_CANDIDATE_ATTEMPTS_PER_RECORD }, generateBook),
        booksAmount,
        (book) => [bookNaturalKey(book)],
        existingKeys,
    );
};
