'use client';

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { deleteReviewAction, fetchUserReviewsAction } from './ReviewService';

export interface SelectedEditReview {
    id: string | number;
    book_id: string;
    rating: number | null;
    review: string;
}

export interface UseUserReviewsProps {
    initialReviews: Review[];
    initialBooksMap: Record<string | number, Partial<BookDB> | null>;
    initialHasMore: boolean;
}

export interface UseUserReviewsReturn {
    reviews: Review[];
    booksMap: Record<string | number, Partial<BookDB> | null>;
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
    initialBooksMap,
    initialHasMore,
}: UseUserReviewsProps): UseUserReviewsReturn => {
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [booksMap, setBooksMap] =
        useState<Record<string | number, Partial<BookDB> | null>>(initialBooksMap);
    const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
    const [page, setPage] = useState<number>(1);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

    const [prevInitialReviews, setPrevInitialReviews] = useState<Review[]>(initialReviews);
    if (prevInitialReviews !== initialReviews) {
        setPrevInitialReviews(initialReviews);
        setReviews(initialReviews);
        setBooksMap(initialBooksMap);
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
            setReviews((prev) => {
                const existingIds = new Set(prev.map((r) => r.id));
                const newReviews = response.reviews.filter((r) => !existingIds.has(r.id));
                return [...prev, ...newReviews];
            });
            setBooksMap((prev) => ({ ...prev, ...response.booksMap }));
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

        try {
            const result = await deleteReviewAction(selectedDeleteId);
            if (result.success) {
                setReviews((prev) => prev.filter((item) => item.id !== selectedDeleteId));
                router.refresh();
            }
        } catch (error: unknown) {
            console.error('[useUserReviews] Failed to delete review:', error);
        } finally {
            handleCloseDeleteModal();
        }
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
        setTimeout(() => {
            setSelectedEditReview(null);
        }, 300);
    };

    return {
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
    };
};
