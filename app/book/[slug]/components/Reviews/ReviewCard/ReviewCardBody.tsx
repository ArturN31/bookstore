'use client';

import { Box, CardContent, Typography } from '@mui/material';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { SelectedReview } from './ReviewCard';
import { ReviewCardHeader } from './ReviewCardHeader';

interface ReviewCardBodyProps {
    review: SelectedReview;
    onEdit?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
}

export const ReviewCardBody = ({ review, onEdit, onDelete }: ReviewCardBodyProps) => {
    return (
        <CardContent className="grow p-6! last:pb-6!">
            <Box className="flex flex-col gap-6">
                <ReviewCardHeader
                    review={review}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />

                <Box className="relative">
                    <FormatQuoteIcon className="absolute -top-3 -left-2.5 -scale-x-100 text-[36px]! text-[#E8E2D5]!" />
                    <Typography
                        variant="body2"
                        className="pl-5! font-serif! text-[0.975rem]! leading-[1.75]! wrap-break-word! whitespace-pre-wrap! text-[#292524]!"
                    >
                        {review.review}
                    </Typography>
                </Box>
            </Box>
        </CardContent>
    );
};
