import { fetchBooksWithReviews, FilterableBookColumns } from '@/data/books/GetBooksData';
import { notFound } from 'next/navigation';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';
import { BooksManager } from '@/components/books/BooksManager';

const formatLabel = (str: string) => str.replace(/-/g, ' ');

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
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

    const initialData = await fetchBooksWithReviews({
        group: group as FilterableBookColumns,
        type: type,
        page: 1,
        limit: 12,
    });

    if (initialData.error || !initialData.data.length) return notFound();

    return (
        <main className="container mx-auto max-w-375 px-4 py-8">
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
                        count: initialData.total,
                    },
                ]}
            />

            <header className="mb-8">
                <h1 className="font-serif text-4xl tracking-tight text-slate-900 capitalize">
                    {formattedType}
                </h1>
                <p className="mt-2 text-slate-600">
                    Showing {initialData.total} {formattedType} books
                </p>
            </header>

            <section aria-label={`${formattedType} books collection`}>
                <BooksManager
                    initialData={initialData}
                    filters={{
                        group: group as FilterableBookColumns,
                        type: type,
                    }}
                />
            </section>
        </main>
    );
}
