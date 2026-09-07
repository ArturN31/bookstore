import { ReactNode } from 'react';

interface ProfileCardContainerProps {
    children: ReactNode;
    colorTheme?: 'amber' | 'blue' | 'purple' | 'emerald';
}

export function ProfileCardContainer({
    children,
    colorTheme = 'amber',
}: ProfileCardContainerProps) {
    const glowColors = {
        amber: 'bg-amber-500/10',
        blue: 'bg-blue-500/10',
        purple: 'bg-purple-500/10',
        emerald: 'bg-emerald-500/10',
    };

    return (
        <div className="bg-gunmetal relative overflow-hidden rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-md">
            <div
                className={`absolute -top-4 -right-4 h-24 w-24 rounded-full ${glowColors[colorTheme]}`}
            />
            {children}
        </div>
    );
}
