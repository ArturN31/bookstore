import { RootLayout } from '@/components/layout/Layout';
import { getBook } from '@/data/book/GetBookData';
import { BookImg } from '@/components/pages/book/BookImg';
import { BookMainDetails } from '@/components/pages/book/BookMainDetails';
import { BookCart } from '@/components/pages/book/BookCart';
import { BookSecondaryDetails } from '@/components/pages/book/BookSecondaryDetails';
import { BookReviews } from '@/components/pages/book/BookReviews';
import { BookDescription } from '@/components/pages/book/BookDescription';
import { booksAddedToCart, getUsersCartID } from '@/data/cart/GetCartData';
import { getUserDataProperty } from '@/data/user/GetUserData';

export default async function BookById({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug as unknown as string;
	const book = await getBook(slug);
	const userID = await getUserDataProperty('id');
	let booksInCartAmount = 0;

	if (userID) {
		const cartID = await getUsersCartID(userID);
		if (cartID) {
			const booksInCart = await booksAddedToCart(cartID);
			if (booksInCart) booksInCartAmount = booksInCart.length;
		}
	}

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

					<BookReviews />
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
