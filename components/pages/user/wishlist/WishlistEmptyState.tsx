import Link from 'next/link';
import { AutoStories, ShoppingBag } from '@mui/icons-material';

export const WishlistEmptyState = () => (
    <section className="py-12">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-200 shadow-sm">
                <AutoStories sx={{ fontSize: 40 }} />
            </div>
            <h2 className="text-gunmetal text-2xl font-bold">Your wishlist is empty</h2>
            <p className="mx-auto mt-3 max-w-sm text-slate-600">
                Explore our collection and save your favorites here.
            </p>
            <Link
                href="/"
                className="group bg-gunmetal mt-10 inline-flex items-center gap-3 rounded-md px-8 py-3.5 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
            >
                <ShoppingBag sx={{ fontSize: 20 }} />
                Start Browsing
            </Link>
        </div>
    </section>
);
