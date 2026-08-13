import { Rating, Stack, Typography } from '@mui/material';

interface ReviewSummaryProps {
    reviewsCount: number;
    averageRating: number;
}

export function ReviewSummary({ reviewsCount, averageRating }: ReviewSummaryProps) {
    const safeRating = reviewsCount > 0 && !Number.isNaN(averageRating) ? averageRating : 0;
    const reviewLabel = reviewsCount === 1 ? 'Review' : 'Reviews';

    return (
        <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
        >
            <Rating
                value={safeRating}
                precision={0.1}
                readOnly
                size="small"
                aria-label={`Rating: ${safeRating.toFixed(1)} out of 5 stars`}
            />

            <Typography
                variant="subtitle1"
                component="span"
                sx={{ fontWeight: 600 }}
            >
                {safeRating.toFixed(1)}
            </Typography>

            <Typography
                variant="body2"
                color="text.secondary"
                component="span"
            >
                ({reviewsCount} {reviewLabel})
            </Typography>
        </Stack>
    );
}
