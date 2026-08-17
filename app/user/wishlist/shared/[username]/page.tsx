import { notFound } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { getPublicWishlistByUsername } from '@/data/user/wishlist/sharing/WishlistShareService';
import { BooksManager } from '@/components/books/BooksManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SharedWishlistPageProps {
    params: Promise<{
        username: string;
    }>;
}

type WishlistWithBook = Wishlist & { books: Book | null };

type SharedWishlistUserData = User & {
    wishlist: WishlistWithBook[];
};

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
    const { username } = await params;

    let profile: SharedWishlistUserData | null = null;
    let fetchError: Error | unknown = null;

    try {
        const result = await getPublicWishlistByUsername(username);
        profile = (result.data as SharedWishlistUserData | null) ?? null;
    } catch (err: unknown) {
        fetchError = err;
    }

    if (fetchError) {
        console.error('[SharedWishlistPage] Data retrieval error:', fetchError);
    }

    if (!profile) notFound();

    const books: Book[] = (profile.wishlist ?? [])
        .map((item) => item.books)
        .filter((book): book is Book => book !== null);

    return (
        <main className="mx-auto max-w-7xl space-y-12 pb-20">
            <header className="mb-12 flex flex-col items-center border-b border-stone-100 pb-8 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-800 shadow-sm">
                    <AutoStoriesIcon className="text-3xl" />
                </div>
                <Typography
                    component="h1"
                    className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl"
                >
                    Shared Book Collection
                </Typography>
                <Typography
                    component="p"
                    className="mt-2 inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
                >
                    Curated by @{profile.username}
                </Typography>
            </header>

            {books.length === 0 ? (
                <Paper className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-12 text-center shadow-none">
                    <MenuBookIcon className="mb-3 text-5xl text-stone-400" />
                    <Typography
                        component="p"
                        className="text-sm text-stone-500"
                    >
                        This wishlist does not contain any books yet.
                    </Typography>
                </Paper>
            ) : (
                <BooksManager
                    initialData={{
                        error: null,
                        data: {
                            data: books,
                            total: books.length,
                            totalPages: 1,
                            currentPage: 1,
                        },
                    }}
                />
            )}
        </main>
    );
}
