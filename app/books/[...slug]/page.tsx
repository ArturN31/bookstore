import { fetchBooksWithReviews } from '@/data/books/GetBooksData';
import { notFound } from 'next/navigation';
import { AppBreadcrumbs } from '@/components/ui/AppBreadcrumbs';
import { BooksManager } from '@/components/books/BooksManager';
import { FilterableBookColumns } from '@/data/books/BookConstants';

const formatLabel = (str: string) => str.replace(/-/g, ' ');

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;

    if (!slug || slug.length < 2) return { title: 'Books | Books4You' };

    const type = decodeURIComponent(slug[1] || '');
    const formattedType = formatLabel(type);
    const title = formattedType.charAt(0).toUpperCase() + formattedType.slice(1);

    return {
        title: `${title} Books | Books4You`,
        description: `Explore our selection of ${formattedType} books available in various formats.`,
    };
}

export default async function BooksByGroupAndType({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const { slug } = await params;

    if (!slug || slug.length < 2) notFound();

    const [group, typeSlug] = slug;
    const type = decodeURIComponent(typeSlug);
    const formattedType = formatLabel(type);

    const response = await fetchBooksWithReviews({
        group: group as FilterableBookColumns,
        type: type,
        page: 1,
        limit: 12,
    });

    if (response.error || !response.data || !response.data.data || response.data.data.length === 0)
        notFound();

    return (
        <main className="container mx-auto max-w-7xl px-4 py-8">
            <AppBreadcrumbs
                items={[
                    {
                        label: formatLabel(group),
                        href: `/books/${group}`,
                    },
                    {
                        label: formattedType,
                        href: '#',
                        active: true,
                        count: response.data.total,
                    },
                ]}
            />

            <header className="mb-8 space-y-2">
                <h1 className="text-gunmetal font-serif text-4xl tracking-tight capitalize">
                    {formattedType}
                </h1>
                <p className="text-slate-500">
                    Showing {response.data.total} {formattedType}{' '}
                    {response.data.total === 1 ? 'book' : 'books'}
                </p>
            </header>

            <section aria-label={`${formattedType} collection`}>
                <BooksManager
                    initialData={response}
                    filters={{
                        group: group as FilterableBookColumns,
                        type: type,
                    }}
                />
            </section>
        </main>
    );
}
