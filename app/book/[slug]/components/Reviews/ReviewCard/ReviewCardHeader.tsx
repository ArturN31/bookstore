'use client';

import { Box, Typography } from '@mui/material';
import { SelectedReview } from './ReviewCard';
import { ReviewCardBodyActionBtns } from './ReviewCardBodyActionBtns';

interface ReviewCardHeaderProps {
    review: SelectedReview;
    onEdit?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
}

const formatDate = (dateVal: Date | string): string => {
    const parsedDate = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString()
        : '';
};

export const ReviewCardHeader = ({ review, onEdit, onDelete }: ReviewCardHeaderProps) => {
    const createdAt = new Date(review.created_at);
    const updatedAt = review.updated_at ? new Date(review.updated_at) : null;

    const isUpdated = Boolean(
        updatedAt && !isNaN(updatedAt.getTime()) && updatedAt.getTime() !== createdAt.getTime(),
    );

    const formattedCreatedDate = formatDate(createdAt);
    const formattedUpdatedDate = updatedAt ? formatDate(updatedAt) : '';

    const showEditedLabel = Boolean(
        isUpdated || (formattedUpdatedDate && formattedUpdatedDate !== formattedCreatedDate),
    );

    return (
        <Box className="flex items-start justify-between gap-4">
            <Box className="flex flex-col gap-0.5">
                <Typography
                    variant="subtitle2"
                    className="text-sm! font-bold! tracking-[0.3px]! text-[#1C1917]!"
                >
                    — {review.username}
                </Typography>
                <Typography
                    variant="caption"
                    className="font-serif! text-xs! text-[#78716C]! italic!"
                >
                    Posted {formattedCreatedDate}
                    {showEditedLabel && formattedUpdatedDate && (
                        <span className="ml-1 text-[#A8A29E]!">
                            • Edited {formattedUpdatedDate}
                        </span>
                    )}
                </Typography>
            </Box>

            <ReviewCardBodyActionBtns
                id={review.id}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </Box>
    );
};
