import { RootLayout } from '@/components/layout/Layout';
import { Books } from '@/components/books/Books';
import { getAllBooks } from '@/data/books/GetBooksData';

export default async function HomePage() {
	const getBooks = async () => {
		const books = await getAllBooks();
		return books;
	};
	let books = await getBooks();

	if (books)
		return (
			<RootLayout>
				<Books
					books={books}
					type='all'
				/>
			</RootLayout>
		);

	return (
		<RootLayout>
			<p>Cannot retrieve books.</p>
		</RootLayout>
	);
}
