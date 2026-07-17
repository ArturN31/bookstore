import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { BookMainDetails } from '@/components/pages/book/BookMainDetails';
import { BookCart } from '@/components/pages/book/BookCart';
import { BookReviews } from '@/components/pages/book/Reviews/BookReviews';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ErrorState } from '@/components/ui/ErrorState';

type BookByIdProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ reviewPagination?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { data: paginatedResult } = await fetchBooksWithReviews({ bookID: slug });

    if (!paginatedResult?.data || paginatedResult.data.length === 0)
        return { title: 'Book Not Found' };

    const book = paginatedResult.data[0];
    return {
        title: `${book.title} by ${book.author} | Books4You`,
        description: book.description?.substring(0, 160) || 'Book details.',
    };
}

export default async function BookById({ params, searchParams }: BookByIdProps) {
    const { slug } = await params;
    const { reviewPagination } = await searchParams;
    const currentPage = parseInt(reviewPagination || '1', 10);

    const { data: paginatedResult, error } = await fetchBooksWithReviews({
        bookID: slug,
    });

    if (error) return <ErrorState message="Could not load book details." />;

    const books = paginatedResult?.data;
    if (!books || books.length === 0) notFound();

    const book = books[0];
    const allReviews = book.reviews || [];

    const reviewsData = {
        data: allReviews,
        total: paginatedResult.total || allReviews.length,
        totalPages: paginatedResult.totalPages || 1,
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
            <header
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
                aria-label="Book overview"
            >
                <div className="grid justify-center overflow-hidden rounded-md bg-black shadow-[0px_2px_6px_-2px_#000]">
                    {/** Use Next Image with sizes so Next generates responsive srcset and serves AVIF/WebP per next.config */}
                    <Image
                        width={400}
                        height={600}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ width: '100%', height: 'auto' }}
                        src={image_url || '/placeholder-book.svg'}
                        alt={`Cover for ${title}`}
                        priority
                    />
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
            </header>

            <hr
                aria-hidden="true"
                className="border-gray-200"
            />

            <section>
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="text-justify leading-relaxed">{description}</p>
            </section>

            <hr
                aria-hidden="true"
                className="border-gray-200"
            />

            <section>
                <h2 className="mb-2 text-lg font-semibold">Technical Details</h2>
                <table className="w-full table-auto">
                    <tbody className="divide-y divide-gray-100">
                        {[
                            { label: 'Title:', value: title },
                            { label: 'Author:', value: author },
                            { label: 'Publisher:', value: publisher },
                            { label: 'Publication date:', value: publication_date },
                            { label: 'Page count:', value: page_count },
                            { label: 'Format:', value: format },
                        ].map((detail) => (
                            <tr
                                className="grid grid-cols-2 py-2"
                                key={detail.label}
                            >
                                <th
                                    scope="row"
                                    className="text-left font-normal text-gray-600"
                                >
                                    {detail.label}
                                </th>
                                <td className="font-medium">{detail.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <hr
                aria-hidden="true"
                className="border-gray-200"
            />

            <BookReviews
                reviewsData={reviewsData}
                slug={slug}
                page={currentPage}
            />
        </article>
    );
}
