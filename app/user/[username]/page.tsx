import { getPublicUserProfile } from '@/data/user/UserService';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { PublicProfileUnavailable } from './components/PublicProfileUnavailable';
import { PublicProfileBanner } from './components/PublicProfileBanner';
import { ReadingActivityCard } from './components/Cards/ReadingActivityCard';
import { PublicWishlistCard } from './components/Cards/PublicWishlistCard';

export default async function PublicProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const resolvedParams = await params;
    const { username } = resolvedParams;

    const { data: profile, error } = await getPublicUserProfile(username);

    if (error && error !== APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND)
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-4">
                <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-900/10">
                    <h1 className="mb-2 text-2xl font-bold text-red-700 dark:text-red-400">
                        Error Loading Profile
                    </h1>
                    <p className="text-red-600 dark:text-red-300">{error}</p>
                </div>
            </div>
        );

    if (error === APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND || !profile)
        return <PublicProfileUnavailable />;

    const hasPublicWishlist = Boolean(profile.is_wishlist_public);

    return (
        <div className="space-y-8 pb-16">
            <PublicProfileBanner profile={profile} />

            <div className="mx-auto max-w-4xl px-4 md:px-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {hasPublicWishlist && <PublicWishlistCard username={username} />}
                    <ReadingActivityCard />
                </div>
            </div>
        </div>
    );
}
