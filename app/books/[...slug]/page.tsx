import { RootLayout } from '@/components/layout/Layout';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { getBookByGroupAndType } from '@/data/books/GetBooksData';
import { Books } from '@/components/books/Books';

export default async function BooksByGroupAndTypePage({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug as unknown as string[];
	const group = slug[0]; //represents the book group - genre/format
	const type = decodeURIComponent(slug[1]); //represents the type - Adventure/Comedy/Paperback/Hardcover
	let books = await getBookByGroupAndType(group, type);

	if (typeof books !== 'string')
		return (
			<RootLayout>
				<div>
					<div className='flex w-fit pb-2'>
						<p>{String(group).charAt(0).toUpperCase() + String(group).slice(1)} </p>

						<KeyboardArrowRightIcon />

						<p>{type}</p>
					</div>

					<Books
						books={books}
						type='all'
					/>
				</div>
			</RootLayout>
		);
}
