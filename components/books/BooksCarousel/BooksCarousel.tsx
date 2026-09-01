'use client';

import { BookCard } from '@/components/books/bookCard/BookCard';
import { useCarouselScroll } from './useCarouselScroll';
import { BooksNavigationButtons } from './BooksNavigationButtons';

interface BooksCarouselProps {
    books: Book[];
    mode: 'related_books' | 'bestsellers';
}

export const BooksCarousel = ({ books, mode }: BooksCarouselProps) => {
    const { scrollContainerRef, canScrollLeft, canScrollRight, handleScroll } = useCarouselScroll(
        books.length,
    );

    return (
        <div className="grid w-full min-w-0 grid-cols-1 overflow-hidden">
            <div className="mb-6">
                <h2 className="text-xl font-semibold">
                    {mode === 'related_books' && 'You Might Also Like'}
                    {mode === 'bestsellers' && 'Trending Bestsellers'}
                </h2>
                <p className="mt-1 text-gray-500">
                    {mode === 'related_books' &&
                        'Discover similar titles based on author, genre, and reader ratings.'}
                    {mode === 'bestsellers' &&
                        "Discover the most popular titles currently capturing our readers' imaginations."}
                </p>
            </div>

            <div className="relative w-full min-w-0 px-12">
                <BooksNavigationButtons
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
