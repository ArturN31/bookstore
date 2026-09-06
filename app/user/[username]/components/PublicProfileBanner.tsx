import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';

export const PublicProfileBanner = ({
    profile,
}: {
    profile: {
        username: string;
        created_at: string;
    };
}) => {
    const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="mx-auto max-w-4xl px-4 md:px-8">
            <div className="h-40 w-full rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 shadow-sm sm:h-48"></div>

            <div className="px-2 pt-6 sm:px-6">
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                    <div className="flex items-end gap-5">
                        <div className="-mt-16 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-amber-50 text-3xl font-bold text-amber-700 shadow-md sm:-mt-20 sm:h-32 sm:w-32 sm:text-4xl">
                            {profile.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="mb-1">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                @{profile.username}
                            </h1>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Joined {joinedDate}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
                        <AutoStoriesOutlinedIcon fontSize="small" />
                        Public Profile
                    </div>
                </div>
            </div>
        </div>
    );
};
