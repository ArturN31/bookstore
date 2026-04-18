export const dynamic = 'force-dynamic';

import { BooksManager } from '@/components/books/BooksManager';
import { ErrorState } from '@/components/ui/ErrorState';
import { HomepageHero } from '@/components/HomepageHero';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Books4You | Discover Your Next Great Read',
    description:
        "Browse our collection of the world's most influential stories, curated for the modern reader.",
};

export default async function HomePage() {
    const response = await fetchBooksWithReviews({ page: 1, limit: 12 });

    if (response.error || !response.data)
        return (
            <ErrorState
                title="Archival Retrieval Failed"
                message={response.error ?? 'We encountered a problem loading the collection.'}
            />
        );

    return (
        <main className="mx-auto max-w-7xl space-y-12 pb-20">
            <HomepageHero booksAmount={response.data.total} />

            <div className="relative px-6">
                <BooksManager initialData={response} />
            </div>
        </main>
    );
}
