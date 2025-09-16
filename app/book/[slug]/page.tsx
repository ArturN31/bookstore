import { RootLayout } from '@/components/layout/Layout';
import { getBook } from '@/data/books/GetBooksData';
import { BookImg } from '@/components/pages/book/Layout/BookImg';
import { BookMainDetails } from '@/components/pages/book/Layout/BookMainDetails';
import { BookCart } from '@/components/pages/book/Cart/BookCart';
import { BookSecondaryDetails } from '@/components/pages/book/Layout/BookSecondaryDetails';
import { BookReviews } from '@/components/pages/book/Reviews/BookReviews';
import { BookDescription } from '@/components/pages/book/Layout/BookDescription';
import { getBookReviewsByBookId } from '@/data/books/GetReviewsData';

export default async function BookById({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ reviewPagination?: string }>;
}) {
	const slug = (await params).slug;
	const book = await getBook(slug);

	const reviewsPaginationPage = parseInt((await searchParams).reviewPagination || '1');
	const REVIEWS_PER_PAGE = 5;
	const reviewsData = book?.id
		? await getBookReviewsByBookId(book.id, reviewsPaginationPage, REVIEWS_PER_PAGE)
		: { data: null, total: 0, totalPages: 0, currentPage: 1 };

	if (book) {
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

						<BookCart book={book} />
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

					<BookReviews
						reviewsData={reviewsData}
						slug={slug}
						page={reviewsPaginationPage}
					/>
				</div>
			</RootLayout>
		);
	}

	return (
		<RootLayout>
			<p>Could not retrieve book data.</p>
		</RootLayout>
	);
}
