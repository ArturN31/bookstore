import { OutputBooks } from '@/components/books/OutputBooks';
import { getAllBooks } from '@/data/books/GetBooksData';

export default async function HomePage() {
	const getBooks = async () => {
		const books = await getAllBooks();
		return books;
	};
	let books = await getBooks();

	if (books)
		return (
			<OutputBooks
				books={books}
				type='all'
			/>
		);

	return <p>Cannot retrieve books.</p>;
}
