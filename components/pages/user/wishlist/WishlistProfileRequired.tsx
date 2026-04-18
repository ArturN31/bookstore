import Link from 'next/link';
import { ArrowForward, ContactPage } from '@mui/icons-material';

export const WishlistProfileRequired = () => (
    <main className="container mx-auto max-w-7xl px-4 py-20">
        <div className="border-gunmetal/10 rounded-xl border-2 bg-white p-12 text-center shadow-sm">
            <div className="text-gunmetal mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                <ContactPage sx={{ fontSize: 40 }} />
            </div>
            <h2 className="text-gunmetal text-2xl font-bold tracking-tight">
                Profile Setup Required
            </h2>
            <p className="mx-auto mt-3 max-w-sm leading-relaxed text-slate-500">
                We need your address details to calculate shipping and sync your wishlist properly.
            </p>
            <Link
                href="/user/profile"
                className="group bg-gunmetal mt-10 inline-flex items-center gap-2 rounded-md px-10 py-3.5 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
            >
                Go to Profile
                <ArrowForward
                    className="transition-transform group-hover:translate-x-1"
                    sx={{ fontSize: 18 }}
                />
            </Link>
        </div>
    </main>
);
