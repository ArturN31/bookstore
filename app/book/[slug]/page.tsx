import { RootLayout } from '@/components/layout/Layout';
import { getBook } from '@/data/book/GetBookData';
import { BookImg } from '@/components/pages/book/Layout/BookImg';
import { BookMainDetails } from '@/components/pages/book/Layout/BookMainDetails';
import { BookCart } from '@/components/pages/book/Cart/BookCart';
import { BookSecondaryDetails } from '@/components/pages/book/Layout/BookSecondaryDetails';
import { BookReviews } from '@/components/pages/book/Reviews/BookReviews';
import { BookDescription } from '@/components/pages/book/Layout/BookDescription';
import { getBooksAddedToCart, getUsersCartID } from '@/data/cart/GetCartData';
import { getUserDataProperty } from '@/data/user/GetUserData';
import { getBookReviewsByBookId } from '@/data/books/GetReviewsData';
import { ReviewPagination } from '@/components/pages/book/Reviews/ReviewPagination';

export default async function BookById({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ reviewPagination?: string }>;
}) {
	const slug = (await params).slug;
	const book = await getBook(slug);
	const userID = await getUserDataProperty('id');
	let booksInCartAmount = 0;

	if (userID) {
		const cartID = await getUsersCartID(userID);
		if (cartID) {
			const booksInCart = await getBooksAddedToCart(cartID);
			if (booksInCart) booksInCartAmount = booksInCart.length;
		}
	}

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

						<BookCart
							price={book.price}
							bookID={book.id}
							booksInCartAmount={booksInCartAmount}
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
