import Link from 'next/link';
import { ReactNode } from 'react';

interface ProfileCardActionButtonProps {
    href: string;
    icon: ReactNode;
    children: ReactNode;
}

export function ProfileCardActionButton({ href, icon, children }: ProfileCardActionButtonProps) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-slate-800 dark:hover:bg-slate-700"
        >
            <span className="text-amber-400">{icon}</span>
            {children}
        </Link>
    );
}
