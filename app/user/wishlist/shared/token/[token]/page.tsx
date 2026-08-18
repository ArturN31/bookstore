import { getWishlistByShareToken } from '@/data/user/wishlist/sharing/WishlistShareService';
import {
    TokenWishlistProfile,
    WishlistBookDto,
} from '@/data/user/wishlist/sharing/WishlistShareRepository';
import { BooksManager } from '@/components/books/BooksManager';
import { RestrictedAccessView } from '../../[username]/components/RestrictedAccessView';
import { SharedWishlistHeader } from '../../[username]/components/SharedWishlistHeader';
import { SharedWishlistHero } from '../../[username]/components/SharedWishlistHero';
import { EmptyWishlistView } from '../../[username]/components/EmptyWishlistView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SharedTokenWishlistPageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function SharedTokenWishlistPage({ params }: SharedTokenWishlistPageProps) {
    const { token } = await params;

    let tokenWishlistData: TokenWishlistProfile | null = null;
    let fetchError: unknown = null;

    try {
        const result = await getWishlistByShareToken(token);
        tokenWishlistData = result.data ?? null;
    } catch (err: unknown) {
        fetchError = err;
    }

    if (fetchError) console.error('[SharedTokenWishlistPage] Data retrieval error:', fetchError);

    if (!tokenWishlistData)
        return (
            <RestrictedAccessView
                username={token}
                isPublicMode={false}
            />
        );

    const rawWishlistItems = tokenWishlistData.wishlist ?? [];
    const books: WishlistBookDto[] = rawWishlistItems
        .map((item) => item.books)
        .filter((book): book is WishlistBookDto => book !== null);

    return (
        <main className="min-h-screen bg-slate-50/60 px-4 py-8 pb-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <SharedWishlistHeader isPublicMode={false} />

                <SharedWishlistHero
                    username={tokenWishlistData.username}
                    totalBooks={books.length}
                    isPublicMode={false}
                />

                <section className="space-y-4 pt-4">
                    {books.length === 0 ? (
                        <EmptyWishlistView
                            username={tokenWishlistData.username}
                            isPublicMode={false}
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
