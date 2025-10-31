import { useRouter } from 'next/navigation';

export const SearchOutput = ({ books }: { books: Book[] }) => {
	const router = useRouter();

	if (books.length === 0) {
		return (
			<div
				data-testid='searchbar-searchoutput'
				className='bg-white rounded-md border absolute mt-12 w-full z-40 p-4 text-center'>
				No books found.
			</div>
		);
	}

	return (
		<div
			data-testid='searchbar-searchoutput'
			className='bg-white rounded-md border absolute mt-12 w-full z-40 shadow-md'>
			{books.map((book) => (
				<button
					key={book.id}
					onClick={() => router.push(`/book/${book.id}`)}
					className='hover:bg-slate-100 hover:cursor-pointer px-2 py-1 w-full text-left border-b last:border-b-0 first:rounded-t-md last:rounded-b-md'>
					{book.title}
				</button>
			))}
		</div>
	);
};
