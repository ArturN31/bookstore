export const BookMainDetails = ({
	stock,
	title,
	author,
	publicationDate,
	publisher,
	format,
	genre,
}: {
	stock: number;
	title: string;
	author: string;
	publicationDate: string;
	publisher: string;
	format: string;
	genre: string;
}) => {
	return (
		<div className='grid border p-5 text-center items-center'>
			{stock <= 25 ? (
				<p className='bg-red-500 w-fit h-fit rounded-full grid items-center px-4 py-1 text-white m-auto'>Low stock</p>
			) : (
				''
			)}
			<div>
				<p className='text-lg font-semibold'>{title}</p>
				<p>
					by{' '}
					<a
						className='hover:cursor-pointer text-sky-500 hover:text-sky-700'
						href={`/books/author/${author}`}>
						{author}
					</a>
				</p>
			</div>

			<hr />

			<div>
				<p className='font-light'>{publicationDate}</p>
				<p>
					by{' '}
					<a
						className='hover:cursor-pointer text-sky-500 hover:text-sky-700'
						href={`/books/publisher/${publisher}`}>
						{publisher}
					</a>
				</p>
				<p>
					<a
						href={`/books/format/${format}`}
						className='hover:cursor-pointer text-sky-500 hover:text-sky-700'>
						{format}
					</a>
				</p>
				<p>
					<a
						href={`/books/genre/${genre}`}
						className='hover:cursor-pointer text-sky-500 hover:text-sky-700'>
						{genre}
					</a>
				</p>
			</div>
		</div>
	);
};
