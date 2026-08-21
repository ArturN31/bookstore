'use client';

import React from 'react';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';

export interface VisibilityToggleProps {
    isPublic: boolean;
    isPending: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VisibilityToggle = ({ isPublic, isPending, onToggle }: VisibilityToggleProps) => {
    return (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3.5 sm:items-center">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                >
                    {isPublic ? (
                        <PublicIcon className="text-xl" />
                    ) : (
                        <LockIcon className="text-xl" />
                    )}
                </div>
                <div>
                    <Typography
                        component="div"
                        className="text-sm font-bold text-slate-900"
                    >
                        {isPublic ? 'Public Wishlist' : 'Private Wishlist'}
                    </Typography>
                    <Typography
                        component="div"
                        className="mt-0.5 text-xs leading-relaxed text-slate-500"
                    >
                        {isPublic
                            ? 'Anyone can view your wishlist via your username profile link.'
                            : 'Hidden from public searches. Only accessible via secure private token link.'}
                    </Typography>
                </div>
            </div>
            <div className="self-end sm:self-center">
                <Switch
                    checked={isPublic}
                    onChange={onToggle}
                    disabled={isPending}
                    slotProps={{
                        input: {
                            'aria-label': 'Toggle public or private wishlist visibility',
                        },
                    }}
                    sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#0f172a',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#0f172a',
                        },
                    }}
                />
            </div>
        </div>
    );
};
