// ReviewCard.tsx
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
    const createdAt = new Date(review.created_at);
    const updatedAt = review.updated_at ? new Date(review.updated_at) : null;

    const isUpdated = Boolean(
        updatedAt && !isNaN(updatedAt.getTime()) && updatedAt.getTime() !== createdAt.getTime(),
    );

    return (
        <Card
            elevation={0}
            className="flex flex-col overflow-hidden rounded-xl! border border-[#E8E2D5]! bg-[#FAF7F2]! shadow-none! sm:flex-row"
        >
            <ReviewCardRating rating={review.rating} />

            <ReviewCardBody
                id={review.id}
                username={review.username}
                review={review.review}
                createdAt={createdAt}
                updatedAt={updatedAt}
                isUpdated={isUpdated}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </Card>
    );
};
