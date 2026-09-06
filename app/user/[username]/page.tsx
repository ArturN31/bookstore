import { getPublicUserProfile } from '@/data/user/UserService';
import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { PublicProfileUnavailable } from './components/PublicProfileUnavailable';
import { PublicProfileBanner } from './components/PublicProfileBanner';

export default async function PublicProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const resolvedParams = await params;
    const { username } = resolvedParams;

    const { data: profile, error } = await getPublicUserProfile(username);

    if (error && error !== APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND) {
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
    }

    if (error === APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND || !profile)
        return <PublicProfileUnavailable />;

    return (
        <div>
            <PublicProfileBanner profile={profile} />
        </div>
    );
}
