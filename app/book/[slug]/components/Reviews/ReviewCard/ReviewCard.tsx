'use client';

import Card from '@mui/material/Card';
import { ReviewCardRating } from './ReviewCardRating';
import { ReviewCardBody } from './ReviewCardBody';

export interface SelectedReview {
    id: string | number;
    username: string;
    rating: number;
    review: string;
    created_at: string;
    updated_at: string;
}

interface ReviewCardProps {
    review: SelectedReview;
    onEdit?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
}

export const ReviewCard = ({ review, onEdit, onDelete }: ReviewCardProps) => {
    return (
        <Card
            elevation={0}
            className="flex flex-col overflow-hidden rounded-xl! border border-[#E8E2D5]! bg-[#FAF7F2]! shadow-none! sm:flex-row"
        >
            <ReviewCardRating rating={review.rating} />

            <ReviewCardBody
                review={review}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </Card>
    );
};
