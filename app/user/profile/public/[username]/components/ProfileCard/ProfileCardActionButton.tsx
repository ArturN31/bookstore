import Link from 'next/link';
import { ReactNode } from 'react';
import { ProfileCardColorTheme } from './ProfileCardContainer';

interface ProfileCardActionButtonProps {
    href: string;
    icon: ReactNode;
    children: ReactNode;
    colorTheme?: ProfileCardColorTheme;
}

export function ProfileCardActionButton({
    href,
    icon,
    children,
    colorTheme = 'amber',
}: ProfileCardActionButtonProps) {
    const iconColors: Record<ProfileCardColorTheme, string> = {
        amber: 'text-amber-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        emerald: 'text-emerald-400',
    };

    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg"
        >
            <span className={iconColors[colorTheme]}>{icon}</span>
            {children}
        </Link>
    );
}
