'use client';

import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export interface EmptyShareStateProps {
    isPending: boolean;
    onGenerate: () => void;
}

export const EmptyShareState = ({ isPending, onGenerate }: EmptyShareStateProps) => {
    return (
        <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
            <Typography
                component="div"
                className="mx-auto max-w-sm text-xs font-medium text-slate-600"
            >
                You do not have an active private share link generated yet. Create one to share your
                wishlist privately.
            </Typography>
            <Button
                variant="contained"
                onClick={onGenerate}
                disabled={isPending}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white normal-case shadow-md shadow-slate-900/10 hover:bg-slate-800"
            >
                Generate Private Share Link
            </Button>
        </div>
    );
};
