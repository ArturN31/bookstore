'use client';

import { Fragment } from 'react';
import { ReviewCard } from '@/app/book/[slug]/components/Reviews/ReviewCard/ReviewCard';
import { DeleteReviewModal } from './DeleteReviewModal';
import { ReviewFormModal } from '@/app/book/[slug]/components/Reviews/ReviewForm/ReviewFormModal';
import { UserReviewHeader } from './UserReviewHeader';
import { InfiniteScrollSentinel } from './InfiniteScrollSentinel';
import { ReviewDB } from './page';
import { useUserReviews } from './useUserReviews';

interface UserReviewsInteractiveProps {
    initialReviews: ReviewDB[];
    initialHasMore: boolean;
}

export const UserReviewsInteractive = ({
    initialReviews,
    initialHasMore,
}: UserReviewsInteractiveProps) => {
    const {
        reviews,
        hasMore,
        isLoadingMore,
        observerTarget,
        isDeleteModalOpen,
        selectedEditReview,
        isEditModalOpen,
        handleOpenDeleteModal,
        handleCloseDeleteModal,
        handleConfirmDelete,
        handleOpenEditModal,
        handleCloseEditModal,
    } = useUserReviews({ initialReviews, initialHasMore });

    return (
        <>
            <div className="space-y-8">
                {reviews.map((review, index) => (
                    <Fragment key={review.id}>
                        <div className="space-y-3">
                            <UserReviewHeader
                                bookId={review.book_id}
                                bookData={review.books}
                            />
                            <ReviewCard
                                review={review}
                                onEdit={handleOpenEditModal}
                                onDelete={handleOpenDeleteModal}
                            />
                        </div>
                    </Fragment>
                ))}

                <InfiniteScrollSentinel
                    targetRef={observerTarget}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                    totalReviewsCount={reviews.length}
                />
            </div>

            <DeleteReviewModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
            />

            {selectedEditReview && (
                <ReviewFormModal
                    bookId={selectedEditReview.book_id}
                    reviewId={selectedEditReview.id}
                    initialRating={selectedEditReview.rating}
                    initialReviewText={selectedEditReview.review}
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                />
            )}
        </>
    );
};
