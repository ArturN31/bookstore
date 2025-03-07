import { Books } from '@/components/books/Books';
import { RootLayout } from '@/components/layout/Layout';
import { getAllBooks } from '@/data/books/GetBooksData';

export default async function UsersWishlist() {
	const getBooks = async () => {
		const books = await getAllBooks();
		return books;
	};
	let books = await getBooks();

	if (books) {
		return (
			<RootLayout>
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] max-w-screen md:max-w-[800px] xl:max-w-[1000px] place-self-center gap-y-5'>
					<Books
						books={books}
						type='wishlisted'
					/>
				</div>
			</RootLayout>
		);
	}

	return (
		<RootLayout>
			<p>Cannot retrieve books.</p>
		</RootLayout>
	);
}
