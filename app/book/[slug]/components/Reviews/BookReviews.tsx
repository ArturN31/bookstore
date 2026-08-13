import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ReviewCard } from '@/app/book/[slug]/components/Reviews/ReviewCard/ReviewCard';
import { ReviewPagination } from '@/app/book/[slug]/components/Reviews/ReviewPagination';
import { ReviewSummary } from './ReviewSummary';
import { ReviewFormModal } from './ReviewForm/ReviewFormModal';

export const BookReviews = ({
    reviewsData,
    bookId,
    slug,
    page,
}: {
    reviewsData: PaginatedReviewsResult;
    bookId: string;
    slug: string;
    page: number;
}) => {
    const reviews = reviewsData.data ?? [];
    const hasReviews = reviews.length > 0;
    const reviewsCount = reviews.length;
    const averageRating = hasReviews
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviewsCount
        : 0;

    return (
        <Box
            id="reviews-section"
            className="mt-4 w-full"
        >
            <Box className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <ReviewSummary
                    reviewsCount={reviewsCount}
                    averageRating={averageRating}
                />

                <ReviewFormModal bookId={bookId} />
            </Box>

            <Stack spacing={2}>
                {!hasReviews && (
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        align="center"
                        className="py-16 italic!"
                    >
                        No reviews yet. Be the first to review this book!
                    </Typography>
                )}

                {reviews.map((review) => (
                    <ReviewCard
                        review={review}
                        key={review.id}
                    />
                ))}
            </Stack>

            {hasReviews && (
                <Box className="mt-3">
                    <ReviewPagination
                        reviewsData={reviewsData}
                        slug={slug}
                        page={page}
                    />
                </Box>
            )}
        </Box>
    );
};
