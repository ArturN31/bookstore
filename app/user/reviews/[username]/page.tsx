import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { createBackendClient } from '@/utils/db/server';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { UserReviewsInteractive } from './components/UserReviewsInteractive';

const PAGE_SIZE = 5;

export default async function UserReviewsPage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const resolvedParams = await params;
    const { username } = resolvedParams;

    const supabase = await createBackendClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    let loggedInUsername: string | null = null;
    if (user) {
        const { data: profileData } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .single();
        loggedInUsername = profileData?.username ?? null;
    }

    const isOwner = loggedInUsername !== null && loggedInUsername === username;

    const reviewsQueryResult = await safeSupabaseQuery(async () =>
        supabase
            .from('book_reviews')
            .select(
                `
                id,
                book_id,
                user_id,
                username,
                rating,
                review,
                created_at,
                updated_at,
                books (
                    id,
                    title,
                    author
                )
            `,
            )
            .eq('username', username)
            .order('created_at', { ascending: false })
            .range(0, PAGE_SIZE),
    );

    const rawReviews = reviewsQueryResult.data ?? [];
    const initialHasMore = rawReviews.length > PAGE_SIZE;
    const slicedRaw = initialHasMore ? rawReviews.slice(0, PAGE_SIZE) : rawReviews;

    const initialReviews: Review[] = slicedRaw.map(({ books: _books, ...review }) => review);
    const initialBooksMap: Record<string | number, Partial<BookDB> | null> = {};

    slicedRaw.forEach((item) => {
        const book = Array.isArray(item.books) ? item.books[0] : item.books;
        initialBooksMap[item.id] = book ?? null;
    });

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
            <div>
                <Link
                    href={`/user/profile/public/${username}`}
                    className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                    <ArrowBackIcon fontSize="small" />
                    Back to Profile
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{username}&apos;s Book Reviews</h1>
                <p className="text-sm text-gray-600">View all the reviews written by {username}.</p>
            </div>

            {reviewsQueryResult.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    Failed to load reviews. Please try again later.
                </div>
            )}

            {!reviewsQueryResult.error && initialReviews.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
                    <RateReviewOutlinedIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <h2 className="text-lg font-medium text-gray-800">No reviews yet</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        This user hasn&apos;t written any book reviews yet.
                    </p>
                </div>
            )}

            {!reviewsQueryResult.error && initialReviews.length > 0 && (
                <UserReviewsInteractive
                    initialReviews={initialReviews}
                    initialBooksMap={initialBooksMap}
                    initialHasMore={initialHasMore}
                    isOwner={isOwner}
                />
            )}
        </div>
    );
}
