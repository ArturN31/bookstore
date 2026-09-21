import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface SharedWishlistHeaderProps {
    isPublicMode?: boolean;
}

export function SharedWishlistHeader({ isPublicMode = true }: SharedWishlistHeaderProps) {
    return (
        <header className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <Link
                href="/"
                className="group inline-flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase transition-colors hover:text-slate-900"
            >
                <ArrowBackIcon
                    sx={{ fontSize: 16 }}
                    className="transition-transform group-hover:-translate-x-1"
                />
                <span>Back to Store</span>
            </Link>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {isPublicMode ? 'Public Showcase' : 'Secure Private Share'}
            </div>
        </header>
    );
}
