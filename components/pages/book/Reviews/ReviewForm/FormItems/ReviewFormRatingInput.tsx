import React from 'react';
import { Box, Rating, Typography } from '@mui/material';

interface ReviewFormRatingInputProps {
    rating: number | null;
    setRating: React.Dispatch<React.SetStateAction<number | null>>;
}

export const ReviewFormRatingInput = ({ rating, setRating }: ReviewFormRatingInputProps) => {
    return (
        <Box className="rounded-xl border border-[#E8E2D5] bg-[#F3EDE2] p-4 py-4 text-center">
            <Typography
                component="legend"
                variant="subtitle1"
                className="mb-2! font-semibold! text-[#292524]!"
            >
                How would you rate this item?
            </Typography>
            <Rating
                name="dialog-rating"
                value={rating}
                onChange={(_event, newValue) => setRating(newValue)}
                size="large"
                className="text-[2.5rem]! [&_.MuiRating-iconEmpty]:text-[#A8A29E]! [&_.MuiRating-iconFilled]:text-[#F59E0B]!"
            />
        </Box>
    );
};
