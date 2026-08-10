import { Box, Rating, Typography } from '@mui/material';

export const ReviewCardRating = ({ rating }: { rating: number }) => {
    return (
        <Box className="bg-gunmetal flex w-full shrink-0 flex-col items-center justify-center p-5 text-[#FAF7F2] sm:w-28.75">
            <Typography
                variant="h4"
                className="leading-none! font-extrabold! text-[#F59E0B]!"
            >
                {rating}
            </Typography>
            <Rating
                value={rating}
                readOnly
                precision={0.5}
                size="small"
                className="my-1.5 [&_.MuiRating-iconEmpty]:text-[#57534E]! [&_.MuiRating-iconFilled]:text-[#F59E0B]!"
            />
            <Typography
                variant="caption"
                className="text-[0.65rem]! font-semibold! tracking-[0.8px]! text-[#A8A29E]! uppercase!"
            >
                Out of 5
            </Typography>
        </Box>
    );
};
