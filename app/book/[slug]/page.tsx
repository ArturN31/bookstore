import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { BookReviews } from '@/components/pages/book/Reviews/BookReviews';
import { notFound } from 'next/navigation';
import { ErrorState } from '@/components/ui/ErrorState';
import { BookHeader } from '@/components/pages/book/Header/BookHeader';
import { BookDetails } from '@/components/pages/book/BookDetails';

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

    return (
        <article
            className="m-auto grid max-w-375 gap-5"
            role="main"
        >
            <BookHeader book={book} />

            <hr
                aria-hidden="true"
                className="border-gray-200"
            />

            <BookDetails book={book} />

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
