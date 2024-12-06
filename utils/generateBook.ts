import { faker } from '@faker-js/faker/locale/en_GB';

const generateBook = (): GeneratedBook => {
	const title = faker.book.title();
	const currentDate = new Date();
	const randomColour = faker.internet.color().split('#')[1];

	return {
		title: title,
		author: faker.book.author(),
		genre: faker.book.genre(),
		publisher: faker.book.publisher(),
		publication_date: faker.date.between({ from: '2000-01-01', to: currentDate }).toDateString(),
		price: faker.commerce.price({ min: 10, max: 25, symbol: '£' }),
		description: faker.lorem.paragraph({ min: 5, max: 15 }),
		format: faker.book.format(),
		page_count: faker.number.int({ min: 100, max: 600 }),
		image_url: `https://placehold.co/400x400@3x/000000/${randomColour}/jpg?text=${title.replaceAll(
			' ',
			'%0A',
		)}&font=Raleway`,
		stock_quantity: faker.number.int({ min: 10, max: 1000, multipleOf: 10 }),
		is_active: Math.random() < 0.8,
	};
};

export const generateBooksArray = (booksAmount: number): GeneratedBook[] => {
	const books: GeneratedBook[] = [];

	while (books.length < booksAmount) {
		const newBook = generateBook();
		const isUnique = !books.some((book) => book.title === newBook.title);

		if (isUnique) {
			books.push(newBook);
		}
	}

	return books;
};
