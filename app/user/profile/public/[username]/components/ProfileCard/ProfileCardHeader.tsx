import { ReactNode } from 'react';

interface ProfileCardHeaderProps {
    icon: ReactNode;
    title: string;
    subtitle: string;
    iconContainerClassName?: string;
}

export function ProfileCardHeader({
    icon,
    title,
    subtitle,
    iconContainerClassName = 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}: ProfileCardHeaderProps) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconContainerClassName}`}
            >
                {icon}
            </div>
            <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
        </div>
    );
}
