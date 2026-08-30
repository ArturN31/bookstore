export const dynamic = 'force-dynamic';

import { ComponentProps } from 'react';
import { BooksManager } from '@/components/books/BooksManager';
import { ErrorState } from '@/components/ui/ErrorState';
import { HomepageHero } from '@/components/HomepageHero';
import { fetchBooksWithReviews, fetchBestsellers } from '@/data/books/BookService';
import { Metadata } from 'next';
import { BooksCarousel } from '@/components/books/BooksCarousel/BooksCarousel';

export const metadata: Metadata = {
    title: 'Books4You | Discover Your Next Great Read',
    description:
        "Browse our collection of the world's most influential stories, curated for the modern reader.",
};

export default async function HomePage() {
    const [booksResponse, bestsellersResponse] = await Promise.all([
        fetchBooksWithReviews({ page: 1, limit: 12 }),
        fetchBestsellers(12),
    ]);

    if (booksResponse.error || !booksResponse.data)
        return (
            <ErrorState
                title="Archival Retrieval Failed"
                message={booksResponse.error ?? 'We encountered a problem loading the collection.'}
            />
        );

    return (
        <main
            className="mx-auto max-w-[1680px] space-y-10 pb-20"
            style={{ marginTop: 'calc(var(--header-height, 150px) + 1rem)' }}
        >
            <HomepageHero booksAmount={booksResponse.data.total} />

            <div className="grid gap-12 px-6">
                {bestsellersResponse.data && bestsellersResponse.data.length > 0 && (
                    <section className="bg-gunmetal/5 rounded-3xl border border-gray-100 p-6 shadow-xs backdrop-blur-sm md:p-8">
                        <BooksCarousel
                            books={
                                bestsellersResponse.data as unknown as ComponentProps<
                                    typeof BooksCarousel
                                >['books']
                            }
                            mode="bestsellers"
                        />
                    </section>
                )}

                <div className="space-y-6">
                    <div className="flex flex-col gap-1 px-1">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                            Explore Catalog
                        </h2>
                        <p className="text-sm text-gray-500">
                            Browse, filter, and search through our entire library collection.
                        </p>
                    </div>
                    <BooksManager initialData={booksResponse} />
                </div>
            </div>
        </main>
    );
}
