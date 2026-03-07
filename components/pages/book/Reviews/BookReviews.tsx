import { ReviewCard } from '@/components/pages/book/Reviews/ReviewCard/ReviewCard';
import { ReviewPagination } from '@/components/pages/book/Reviews/ReviewPagination';

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

    const reviews = reviewsData.data;
    const hasReviews = reviews.length > 0;

    //TODO: Implement Reviews Insert & Potentialy a page where users can see their reviews.

    return (
        <div id="reviews-section">
            <p className="text-lg font-semibold">({reviewsData.total}) Reviews</p>

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
