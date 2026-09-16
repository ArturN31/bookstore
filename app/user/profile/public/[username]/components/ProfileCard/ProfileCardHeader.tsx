import { ReactNode } from 'react';
import { ProfileCardColorTheme } from './ProfileCardContainer';

interface ProfileCardHeaderProps {
    icon: ReactNode;
    title: string;
    subtitle: string;
    colorTheme?: ProfileCardColorTheme;
    iconContainerClassName?: string;
}

export function ProfileCardHeader({
    icon,
    title,
    subtitle,
    colorTheme = 'amber',
    iconContainerClassName,
}: ProfileCardHeaderProps) {
    const iconThemeStyles: Record<ProfileCardColorTheme, string> = {
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    };

    const resolvedIconStyles = iconContainerClassName ?? iconThemeStyles[colorTheme];

    return (
        <div className="mb-4 flex items-center gap-3">
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${resolvedIconStyles}`}
            >
                {icon}
            </div>
            <div>
                <h2 className="text-base font-semibold text-white">{title}</h2>
                <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
        </div>
    );
}
