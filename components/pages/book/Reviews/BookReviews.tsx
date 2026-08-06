import { ReviewCard } from '@/components/pages/book/Reviews/ReviewCard/ReviewCard';
import { ReviewPagination } from '@/components/pages/book/Reviews/ReviewPagination';
import { ReviewSummary } from './ReviewSummary';

export const BookReviews = ({
    reviewsData,
    slug,
    page,
}: {
    reviewsData: PaginatedReviewsResult;
    slug: string;
    page: number;
}) => {
    if (!reviewsData?.data) return null;

    const reviews = reviewsData.data ?? [];
    const reviewsCount = reviews.length ?? 0;
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    const hasReviews = reviews.length > 0;

    return (
        <div id="reviews-section">
            <ReviewSummary
                reviewsCount={reviewsCount}
                averageRating={averageRating}
            />

            <div className="grid gap-3 pt-3">
                {!hasReviews && (
                    <p className="py-10 text-center text-gray-500 italic">
                        No reviews yet. Be the first to review this book!
                    </p>
                )}

                {reviews.map((review) => (
                    <ReviewCard
                        review={review}
                        key={review.id}
                    />
                ))}
            </div>

            {hasReviews && (
                <ReviewPagination
                    reviewsData={reviewsData}
                    slug={slug}
                    page={page}
                />
            )}
        </div>
    );
};
