'use client';

import { BookCard } from '@/components/books/bookCard/BookCard';
import { RelatedBooksNavigationButtons } from './RelatedBooksNavigationButtons';
import { useCarouselScroll } from './useCarouselScroll';

interface RelatedBooksCarouselProps {
    books: Book[];
}

export const RelatedBooksCarousel = ({ books }: RelatedBooksCarouselProps) => {
    const { scrollContainerRef, canScrollLeft, canScrollRight, handleScroll } = useCarouselScroll(
        books.length,
    );

    return (
        <div className="grid w-full min-w-0 grid-cols-1 overflow-hidden">
            <div className="mb-6">
                <h2 className="text-xl font-semibold">You Might Also Like</h2>
                <p className="mt-1 text-gray-500">
                    Discover similar titles based on author, genre, and reader ratings.
                </p>
            </div>

            <div className="relative w-full min-w-0 px-12">
                <RelatedBooksNavigationButtons
                    handleScroll={handleScroll}
                    canScrollLeft={canScrollLeft}
                    canScrollRight={canScrollRight}
                />

                <div
                    ref={scrollContainerRef}
                    className="flex w-full min-w-0 scrollbar-none gap-5 overflow-x-auto scroll-smooth py-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    {books.map((book) => (
                        <div
                            key={book.id}
                            className="w-55 max-w-55 min-w-55 shrink-0"
                        >
                            <BookCard book={book} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
