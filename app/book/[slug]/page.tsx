import { RootLayout } from '@/components/layout/Layout';
import { getBook } from '@/data/book/GetBookData';
import { BookImg } from '@/components/books/bookPage/BookImg';
import { BookMainDetails } from '@/components/books/bookPage/BookMainDetails';
import { BookCart } from '@/components/books/bookPage/BookCart';
import { BookSecondaryDetails } from '@/components/books/bookPage/BookSecondaryDetails';
import { BookReviews } from '@/components/books/bookPage/BookReviews';
import { BookDescription } from '@/components/books/bookPage/BookDescription';

export default async function BookById({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug as unknown as string;
	const book = await getBook(slug);

	if (typeof book !== 'string') {
		return (
			<RootLayout>
				<div className='grid gap-5 max-w-[1000px] m-auto'>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
						<BookImg
							image={book.image_url}
							title={book.title}
						/>

						<BookMainDetails
							stock={book.stock_quantity}
							title={book.title}
							author={book.author}
							publicationDate={book.publication_date}
							publisher={book.publisher}
							format={book.format}
							genre={book.genre}
						/>

						<BookCart
							price={book.price}
							bookID={book.id}
						/>
					</div>

					<hr />

					<BookDescription description={book.description} />

					<hr />

					<BookSecondaryDetails
						publicationDate={book.publication_date}
						pageCount={book.page_count}
						format={book.format}
						publisher={book.publisher}
						author={book.author}
						title={book.title}
					/>

					<hr />

					<BookReviews />
				</div>
			</RootLayout>
		);
	}
}
