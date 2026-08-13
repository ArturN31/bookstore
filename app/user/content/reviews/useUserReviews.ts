import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { ReviewDB } from './page';
import { fetchUserReviewsAction, deleteReviewAction } from './ReviewActions';

export interface SelectedEditReview {
    id: string | number;
    book_id: string;
    rating: number | null;
    review: string;
}

export interface UseUserReviewsProps {
    initialReviews: ReviewDB[];
    initialHasMore: boolean;
}

export interface UseUserReviewsReturn {
    reviews: ReviewDB[];
    hasMore: boolean;
    isLoadingMore: boolean;
    observerTarget: RefObject<HTMLDivElement | null>;
    isDeleteModalOpen: boolean;
    selectedEditReview: SelectedEditReview | null;
    isEditModalOpen: boolean;
    handleOpenDeleteModal: (id: string | number) => void;
    handleCloseDeleteModal: () => void;
    handleConfirmDelete: () => Promise<void>;
    handleOpenEditModal: (id: string | number) => void;
    handleCloseEditModal: () => void;
}

export const useUserReviews = ({
    initialReviews,
    initialHasMore,
}: UseUserReviewsProps): UseUserReviewsReturn => {
    const router = useRouter();

    const [reviews, setReviews] = useState<ReviewDB[]>(initialReviews);
    const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
    const [page, setPage] = useState<number>(1);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

    const [prevInitialReviews, setPrevInitialReviews] = useState<ReviewDB[]>(initialReviews);
    if (prevInitialReviews !== initialReviews) {
        setPrevInitialReviews(initialReviews);
        setReviews(initialReviews);
        setHasMore(initialHasMore);
        setPage(1);
    }

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<string | number | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [selectedEditReview, setSelectedEditReview] = useState<SelectedEditReview | null>(null);

    const observerTarget = useRef<HTMLDivElement | null>(null);

    const loadMoreReviews = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        const nextPage = page + 1;
        const response = await fetchUserReviewsAction(nextPage);

        if (!response.error) {
            setReviews((prev) => [...prev, ...response.reviews]);
            setHasMore(response.hasMore);
            setPage(nextPage);
        }
        setIsLoadingMore(false);
    }, [isLoadingMore, hasMore, page]);

    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    void loadMoreReviews();
                }
            },
            { threshold: 0.5 },
        );

        observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [hasMore, isLoadingMore, loadMoreReviews]);

    const handleOpenDeleteModal = (id: string | number) => {
        setSelectedDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedDeleteId(null);
    };

    const handleConfirmDelete = async () => {
        if (selectedDeleteId === null) return;

        await deleteReviewAction(selectedDeleteId);
        setReviews((prev) => prev.filter((item) => item.id !== selectedDeleteId));
        handleCloseDeleteModal();
    };

    const handleOpenEditModal = (id: string | number) => {
        const targetReview = reviews.find((item) => item.id === id);
        if (targetReview) {
            setSelectedEditReview({
                id: targetReview.id,
                book_id: targetReview.book_id,
                rating: targetReview.rating,
                review: targetReview.review,
            });
            setIsEditModalOpen(true);
        }
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedEditReview(null);
        router.refresh();
    };

    return {
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
    };
};
