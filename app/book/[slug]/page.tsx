import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { BookMainDetails } from '@/components/pages/book/BookMainDetails';
import { BookCart } from '@/components/pages/book/BookCart';
import { BookReviews } from '@/components/pages/book/Reviews/BookReviews';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ErrorState } from '@/components/ErrorState';

type BookByIdProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ reviewPagination?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const books = await fetchBooksWithReviews({ bookID: slug });

    if (!books.data?.length) return { title: 'Book Not Found' };

    const book = books.data[0];
    return {
        title: `${book.title} by ${book.author} | Books4You`,
        description: book.description.substring(0, 160),
    };
}

export default async function BookById({ params, searchParams }: BookByIdProps) {
    const { slug } = await params;
    const { reviewPagination } = await searchParams;
    const currentPage = parseInt(reviewPagination || '1', 10);

    const { data: books, error } = await fetchBooksWithReviews({ bookID: slug });

    if (error) return <ErrorState />;
    if (!books || books.length === 0) notFound();

    const book = books[0];
    const allReviews = book.reviews || [];

    const reviewsData = {
        data: allReviews,
        total: allReviews.length,
        totalPages: 1,
        currentPage: currentPage,
        error: null,
    };

    const {
        image_url,
        title,
        stock_quantity,
        author,
        publication_date,
        publisher,
        format,
        genre,
        page_count,
        description,
    } = book;

    return (
        <article
            className="m-auto grid max-w-375 gap-5"
            role="main"
        >
            <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
                aria-label="Book overview"
            >
                <div className="grid justify-center rounded-md bg-black shadow-[0px_2px_6px_-2px_#000]">
                    <div className="grid justify-center rounded-md bg-black shadow-[0px_2px_6px_-2px_#000]">
                        <Image
                            width="0"
                            height="0"
                            sizes="100vw"
                            style={{ width: '100%', height: 'auto' }}
                            src={image_url}
                            alt={`Placeholder image for ${title}`}
                        />
                    </div>
                </div>

                <BookMainDetails
                    stock={stock_quantity}
                    title={title}
                    author={author}
                    publicationDate={publication_date}
                    publisher={publisher}
                    format={format}
                    genre={genre}
                />

                <BookCart book={book} />
            </div>

            <hr aria-hidden="true" />

            <p className="text-lg font-semibold">Description</p>
            <p className="text-justify">{description}</p>

            <hr aria-hidden="true" />

            <p className="text-lg font-semibold">Details</p>
            <table className="table-auto">
                <tbody>
                    {[
                        { text: 'Publication date:', value: publication_date },
                        { text: 'Page count:', value: page_count },
                        { text: 'Format:', value: format },
                        { text: 'Publisher:', value: publisher },
                        { text: 'Author:', value: author },
                        { text: 'Title:', value: title },
                    ].map((el) => (
                        <tr
                            className="grid grid-cols-2 gap-10"
                            key={el.text}
                        >
                            <th
                                scope="row"
                                className="text-left font-normal"
                            >
                                {el.text}
                            </th>
                            <td>{el.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr aria-hidden="true" />

            <BookReviews
                reviewsData={reviewsData}
                slug={slug}
                page={currentPage}
            />
        </article>
    );
}
