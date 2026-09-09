import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Link from 'next/link';

export const PublicProfileUnavailable = () => {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
                <div className="h-2 w-full bg-amber-400"></div>
                <div className="p-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <VpnKeyOutlinedIcon className="text-2xl" />
                    </div>
                    <h1 className="mb-2 text-xl font-bold text-slate-900">Profile Unavailable</h1>
                    <p className="mb-6 text-sm text-slate-600">
                        This user does not exist or has chosen to keep their profile private.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};
