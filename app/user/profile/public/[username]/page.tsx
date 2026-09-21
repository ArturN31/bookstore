import { APP_ERROR_MESSAGES } from '@/utils/errors/ErrorHandlerConstants';
import { PublicProfileUnavailable } from './components/PublicProfileUnavailable';
import { PublicProfileBanner } from './components/PublicProfileBanner';
import { ReadingActivityCard } from './components/Cards/ReadingActivityCard';
import {
    getPublicProfile,
    getUserPrivacySettings,
} from '@/data/user/profile/PrivacySettingsService';
import { checkIsOwner } from '@/utils/auth/checkOwnership';
import { PrivacySettingsControl } from './components/Settings/PrivacySettingsControl';
import { PublicWishlistCard } from './components/Cards/PublicWishlistCard';

export default async function PublicProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const resolvedParams = await params;
    const { username } = resolvedParams;

    const [isOwner, { data: profile, error }] = await Promise.all([
        checkIsOwner(username),
        getPublicProfile(username),
    ]);

    if (error && error !== APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND)
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-4">
                <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                    <h1 className="mb-2 text-2xl font-bold text-red-700">Error Loading Profile</h1>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );

    if (error === APP_ERROR_MESSAGES.ERROR_PROFILE_NOT_FOUND || !profile)
        return <PublicProfileUnavailable />;

    const isProfilePublic = Boolean(profile.is_profile_public);

    if (!isProfilePublic && !isOwner)
        return (
            <div className="space-y-8 pb-16">
                <PublicProfileBanner
                    profile={profile}
                    mode="private"
                />
            </div>
        );

    const hasPublicWishlist = Boolean(profile.is_wishlist_public);
    const hasPublicReviews = Boolean(profile.are_reviews_public);

    const ownerSettingsResult = isOwner ? await getUserPrivacySettings(profile.id) : null;
    const initialSettings = ownerSettingsResult?.data ?? null;

    return (
        <div className="space-y-8 pb-16">
            <PublicProfileBanner
                profile={profile}
                mode={isProfilePublic ? 'public' : 'private'}
            />

            {isOwner && initialSettings && (
                <div className="mx-auto flex max-w-4xl justify-end px-4 md:px-8">
                    <PrivacySettingsControl
                        userId={profile.id}
                        initialSettings={initialSettings}
                    />
                </div>
            )}

            <div className="mx-auto max-w-4xl px-4 md:px-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {(hasPublicWishlist || isOwner) && (
                        <PublicWishlistCard
                            username={username}
                            isPublic={hasPublicWishlist}
                        />
                    )}
                    {(hasPublicReviews || isOwner) && (
                        <ReadingActivityCard
                            username={username}
                            isPublic={hasPublicReviews}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
