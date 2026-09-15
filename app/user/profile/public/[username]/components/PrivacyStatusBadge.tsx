import React from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';

export interface PrivacyStatusBadgeProps {
    isPublic: boolean;
    publicLabel?: string;
    privateLabel?: string;
    className?: string;
}

export const PrivacyStatusBadge: React.FC<PrivacyStatusBadgeProps> = ({
    isPublic,
    publicLabel = 'Public',
    privateLabel = 'Private',
    className = '',
}) => {
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                isPublic
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400'
            } ${className}`}
        >
            {isPublic ? (
                <>
                    <PublicOutlinedIcon style={{ fontSize: 13 }} />
                    {publicLabel}
                </>
            ) : (
                <>
                    <LockOutlinedIcon style={{ fontSize: 13 }} />
                    {privateLabel}
                </>
            )}
        </span>
    );
};
