'use client';

import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    fullPage?: boolean;
}

export const ErrorState = ({
    title = 'Connection Interrupted',
    message = "We're having trouble reaching our archives. Please check your connection or try again.",
    onRetry,
    fullPage = true,
}: ErrorStateProps) => {
    return (
        <div
            className={`flex flex-col items-center justify-center p-6 text-center ${fullPage ? 'min-h-[60vh]' : 'py-12'}`}
        >
            <div className="max-w-md space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <ErrorOutlineOutlinedIcon sx={{ fontSize: 32 }} />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
                    <p className="leading-relaxed text-gray-500">{message}</p>
                </div>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95"
                    >
                        <RefreshIcon sx={{ fontSize: 18 }} />
                        Refresh Page
                    </button>
                )}
            </div>
        </div>
    );
};
