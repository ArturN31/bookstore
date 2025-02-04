import { OutputBook } from './OutputBook';

export const Books = ({ books }: { books: Book[] }) => {
	return (
		<div className='grid md:grid-cols-4 sm:grid-cols-2 max-w-[1000px] place-self-center gap-y-5'>
			{books.map((book, index) => (
				<OutputBook
					book={book}
					index={index + 1}
					key={book.id}
				/>
			))}
		</div>
	);
};
