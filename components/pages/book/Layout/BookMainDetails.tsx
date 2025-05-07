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
		<div className='grid p-5 text-center items-center border rounded-md shadow-[0px_2px_6px_-2px_#000]'>
			{stock <= 25 ? (
				<p className='bg-red-500 w-fit h-fit rounded-full grid items-center px-4 py-1 text-white m-auto'>Low stock</p>
			) : (
				''
			)}
			<div>
				<p className='text-lg font-semibold'>{title}</p>
				<p>
					<span>by </span>
					<a
						className='hover:cursor-pointer text-sky-500 hover:text-sky-700'
						href={`/books/author/${author}`}>
						{author}
					</a>
				</p>
			</div>

			<hr className='h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25' />

			<div>
				<p>Published: {publicationDate}</p>
				<p>
					<span>Publisher: </span>
					<a
						className='hover:cursor-pointer text-sky-500 hover:text-sky-700'
						href={`/books/publisher/${publisher}`}>
						{publisher}
					</a>
				</p>
				<p>
					<span>Format: </span>
					<a
						href={`/books/format/${format}`}
						className='hover:cursor-pointer text-sky-500 hover:text-sky-700'>
						{format}
					</a>
				</p>
				<p>
					<span>Genre: </span>
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
