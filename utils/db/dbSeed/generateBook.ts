import { faker } from '@faker-js/faker/locale/en_GB';

const generateBook = (): BookDB => {
    const title = faker.book.title();
    const currentDate = new Date();

    const randomColour = faker.color.rgb({ prefix: '' });

    return {
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
    };
};

export const generateBooksArray = (booksAmount: number): BookDB[] => {
    const books: BookDB[] = [];

    while (books.length < booksAmount) {
        const newBook = generateBook();
        if (!books.some((book) => book.title === newBook.title)) books.push(newBook);
    }

    return books;
};
