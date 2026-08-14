'use client';

import { Fragment } from 'react';
import { ReviewCard } from '@/app/book/[slug]/components/Reviews/ReviewCard/ReviewCard';
import { DeleteReviewModal } from './DeleteReviewModal';
import { ReviewFormModal } from '@/app/book/[slug]/components/Reviews/ReviewForm/ReviewFormModal';
import { UserReviewHeader } from './UserReviewHeader';
import { InfiniteScrollSentinel } from './InfiniteScrollSentinel';
import { useUserReviews } from '../useUserReviews';

interface UserReviewsInteractiveProps {
    initialReviews: Review[];
    initialBooksMap: Record<string | number, Partial<BookDB> | null>;
    initialHasMore: boolean;
}

export const UserReviewsInteractive = ({
    initialReviews,
    initialBooksMap,
    initialHasMore,
}: UserReviewsInteractiveProps) => {
    const {
        reviews,
        booksMap,
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
    } = useUserReviews({ initialReviews, initialBooksMap, initialHasMore });

    return (
        <>
            <div className="space-y-8">
                {reviews.map((review) => (
                    <Fragment key={review.id}>
                        <div className="space-y-3">
                            <UserReviewHeader
                                bookId={review.book_id}
                                bookData={booksMap[review.id]}
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

            <ReviewFormModal
                bookId={selectedEditReview?.book_id || ''}
                reviewId={selectedEditReview?.id}
                initialRating={selectedEditReview?.rating || 0}
                initialReviewText={selectedEditReview?.review || ''}
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
            />
        </>
    );
};
