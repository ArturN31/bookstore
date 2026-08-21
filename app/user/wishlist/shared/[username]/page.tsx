import { getPublicWishlistByUsername } from '@/data/user/wishlist/sharing/WishlistShareService';
import {
    PublicWishlistProfile,
    WishlistBookDto,
} from '@/data/user/wishlist/sharing/WishlistShareRepository';
import { BooksManager } from '@/components/books/BooksManager';
import { RestrictedAccessView } from './components/RestrictedAccessView';
import { SharedWishlistHeader } from './components/SharedWishlistHeader';
import { SharedWishlistHero } from './components/SharedWishlistHero';
import { EmptyWishlistView } from './components/EmptyWishlistView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SharedWishlistPageProps {
    params: Promise<{
        username: string;
    }>;
}

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
    const { username } = await params;

    let publicWishlistData: PublicWishlistProfile | null = null;
    let fetchError: unknown = null;

    try {
        const result = await getPublicWishlistByUsername(username);
        publicWishlistData = result.data ?? null;
    } catch (err: unknown) {
        fetchError = err;
    }

    if (fetchError) console.error('[SharedWishlistPage] Data retrieval error:', fetchError);

    if (!publicWishlistData)
        return (
            <RestrictedAccessView
                username={username}
                isPublicMode={true}
            />
        );

    const rawWishlistItems = publicWishlistData.wishlist ?? [];
    const books: WishlistBookDto[] = rawWishlistItems
        .map((item) => item.books)
        .filter((book): book is WishlistBookDto => book !== null);

    return (
        <main className="min-h-screen bg-slate-50/60 px-4 py-8 pb-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <SharedWishlistHeader isPublicMode={true} />

                <SharedWishlistHero
                    username={publicWishlistData.username}
                    totalBooks={books.length}
                    isPublicMode={true}
                />

                <section className="space-y-4 pt-4">
                    {books.length === 0 ? (
                        <EmptyWishlistView
                            username={publicWishlistData.username}
                            isPublicMode={true}
                        />
                    ) : (
                        <BooksManager
                            initialData={{
                                error: null,
                                data: {
                                    data: books as unknown as Book[],
                                    total: books.length,
                                    totalPages: 1,
                                    currentPage: 1,
                                },
                            }}
                        />
                    )}
                </section>
            </div>
        </main>
    );
}
