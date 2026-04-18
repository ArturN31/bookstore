'use client';

import { useMemo } from 'react';
import StarIcon from '@mui/icons-material/Star';

interface Review {
    rating: number;
}

interface BookRatingProps {
    reviews: Review[];
    variant?: 'default' | 'badge';
}

export const BookRating = ({ reviews, variant = 'badge' }: BookRatingProps) => {
    const averageRating = useMemo(() => {
        if (!reviews || reviews.length === 0) return 0;
        const total = reviews.reduce((acc, review) => acc + review.rating, 0);
        return total / reviews.length;
    }, [reviews]);

    if (!reviews || reviews.length === 0) return null;

    if (variant === 'badge') {
        return (
            <div
                className="flex items-center gap-1 bg-[#1e293b] py-1.5 pr-5 pl-2.5 text-white shadow-lg"
                style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }}
            >
                <span className="text-base font-black tracking-tight italic">
                    {averageRating.toFixed(1)}
                </span>
                <StarIcon sx={{ color: '#facc15', fontSize: '0.8rem' }} />
            </div>
        );
    }

    const percentage = (averageRating / 5) * 100;

    return (
        <div className="flex w-full max-w-30 flex-col gap-1">
            <div className="flex items-baseline gap-1">
                <span className="text-[14px] font-black text-[#1e293b]">
                    {averageRating.toFixed(1)}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">Rating</span>
            </div>
            <div className="h-1 w-full bg-slate-100">
                <div
                    className="h-full bg-[#facc15] transition-all duration-700"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
