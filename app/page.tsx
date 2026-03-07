export const dynamic = 'force-dynamic';

import { BooksManager } from '@/components/books/BooksManager';
import { ErrorState } from '@/components/ErrorState';
import { HomepageHero } from '@/components/HomepageHero';
import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Books4You | Discover Your Next Great Read',
    description:
        "Browse our collection of the world's most influential stories, curated for the modern reader.",
};

export default async function HomePage() {
    const initialData = await fetchBooksWithReviews({ page: 1, limit: 12 });

    if (initialData.error) return <ErrorState />;

    return (
        <main className="mx-auto max-w-375 space-y-12">
            <HomepageHero booksAmount={initialData.total} />
            <div className="relative px-6">
                <BooksManager initialData={initialData} />
            </div>
        </main>
    );
}
