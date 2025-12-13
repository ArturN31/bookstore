import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { getBooksByGroupAndType } from '@/data/books/GetBooksData';
import { OutputBooks } from '@/components/books/OutputBooks';

export default async function BooksByGroupAndType({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const slug = (await params).slug as unknown as string[];
	const group = slug[0]; //represents the book group - genre/format
	const type = decodeURIComponent(slug[1]); //represents the type - Adventure/Comedy/Paperback/Hardcover
	let books = await getBooksByGroupAndType(group, type);

	if (books)
		return (
			<div>
				<div className='flex w-fit pb-2'>
					<p>{String(group).charAt(0).toUpperCase() + String(group).slice(1)} </p>

					<KeyboardArrowRightIcon />

					<p>{type}</p>
				</div>

				<OutputBooks
					books={books}
					type='all'
				/>
			</div>
		);

	return <p>Cannot retrieve books.</p>;
}
