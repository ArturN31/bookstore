import { BooksCarousel } from '@/components/books/BooksCarousel/BooksCarousel';
import { fetchRelatedBooks } from '@/data/books/BookService';

interface RelatedBooksProps {
    bookId: string;
    limit?: number;
}

export const RelatedBooks = async ({ bookId, limit = 12 }: RelatedBooksProps) => {
    const { data: relatedBooks, error } = await fetchRelatedBooks(bookId, limit);

    if (error || !relatedBooks || relatedBooks.length === 0) return null;

    return (
        <section
            className="w-full border-t border-slate-200/80 py-8 dark:border-slate-800"
            aria-label="Related Books"
        >
            <BooksCarousel
                books={relatedBooks as unknown as Book[]}
                mode="related_books"
            />
        </section>
    );
};
