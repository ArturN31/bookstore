import { UserReviewsInteractive } from '@/app/user/content/reviews/components/UserReviewsInteractive';
import { useUserReviews } from '@/data/books/reviews/useUserReviews';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/data/books/reviews/useUserReviews', () => ({
    useUserReviews: jest.fn(),
}));

jest.mock('@/app/book/[slug]/components/Reviews/ReviewCard/ReviewCard', () => ({
    ReviewCard: ({
        review,
        onEdit,
        onDelete,
    }: {
        review: Review;
        onEdit: (rev: Review) => void;
        onDelete: (id: string | number) => void;
    }) => (
        <div data-testid={`review-card-${review.id}`}>
            <span>{review.review}</span>
            <button onClick={() => onEdit(review)}>Edit</button>
            <button onClick={() => onDelete(review.id)}>Delete</button>
        </div>
    ),
}));

jest.mock('@/app/user/content/reviews/components/DeleteReviewModal', () => ({
    DeleteReviewModal: ({
        isOpen,
        onClose,
        onConfirm,
    }: {
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => Promise<void>;
    }) =>
        isOpen ? (
            <div data-testid="delete-modal">
                <button onClick={onClose}>Close Delete</button>
                <button
                    onClick={() => {
                        void onConfirm();
                    }}
                >
                    Confirm Delete
                </button>
            </div>
        ) : null,
}));

jest.mock('@/app/book/[slug]/components/Reviews/ReviewForm/ReviewFormModal', () => ({
    ReviewFormModal: ({
        isOpen,
        onClose,
        bookId,
        reviewId,
    }: {
        isOpen: boolean;
        onClose: () => void;
        bookId: string;
        reviewId?: string | number;
    }) =>
        isOpen ? (
            <div data-testid="edit-modal">
                <span>
                    Editing Review {reviewId} for Book {bookId}
                </span>
                <button onClick={onClose}>Close Edit</button>
            </div>
        ) : null,
}));

jest.mock('@/app/user/content/reviews/components/UserReviewHeader', () => ({
    UserReviewHeader: ({ bookId }: { bookId: string }) => (
        <div data-testid={`user-review-header-${bookId}`} />
    ),
}));

jest.mock('@/app/user/content/reviews/components/InfiniteScrollSentinel', () => ({
    InfiniteScrollSentinel: ({
        isLoadingMore,
        hasMore,
        totalReviewsCount,
    }: {
        isLoadingMore: boolean;
        hasMore: boolean;
        totalReviewsCount: number;
    }) => (
        <div data-testid="infinite-scroll-sentinel">
            {isLoadingMore && <span>Loading...</span>}
            <span>Total: {totalReviewsCount}</span>
            {!hasMore && <span>No more</span>}
        </div>
    ),
}));

describe('UserReviewsInteractive', () => {
    const mockHandleOpenDeleteModal = jest.fn();
    const mockHandleCloseDeleteModal = jest.fn();
    const mockHandleConfirmDelete = jest.fn().mockResolvedValue(undefined);
    const mockHandleOpenEditModal = jest.fn();
    const mockHandleCloseEditModal = jest.fn();
    const mockObserverTarget = { current: null };

    const mockReview: Review = {
        id: 'rev-1',
        book_id: 'book-1',
        user_id: 'user-1',
        rating: 5,
        review: 'Great book!',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        username: '',
    };

    const defaultHookValues = {
        reviews: [mockReview],
        booksMap: { 'rev-1': { title: 'Test Book', author: 'Test Author' } },
        hasMore: true,
        isLoadingMore: false,
        observerTarget: mockObserverTarget,
        isDeleteModalOpen: false,
        selectedEditReview: null,
        isEditModalOpen: false,
        handleOpenDeleteModal: mockHandleOpenDeleteModal,
        handleCloseDeleteModal: mockHandleCloseDeleteModal,
        handleConfirmDelete: mockHandleConfirmDelete,
        handleOpenEditModal: mockHandleOpenEditModal,
        handleCloseEditModal: mockHandleCloseEditModal,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useUserReviews as jest.Mock).mockReturnValue(defaultHookValues);
    });

    it('should render reviews, header, and sentinel correctly', () => {
        render(
            <UserReviewsInteractive
                initialReviews={[mockReview]}
                initialBooksMap={{ 'rev-1': { title: 'Test Book' } }}
                initialHasMore={true}
            />,
        );

        expect(screen.getByTestId('review-card-rev-1')).toBeInTheDocument();
        expect(screen.getByTestId('user-review-header-book-1')).toBeInTheDocument();
        expect(screen.getByTestId('infinite-scroll-sentinel')).toBeInTheDocument();
        expect(screen.getByText('Total: 1')).toBeInTheDocument();
    });

    it('should trigger handleOpenEditModal when edit button on review card is clicked', () => {
        render(
            <UserReviewsInteractive
                initialReviews={[mockReview]}
                initialBooksMap={{}}
                initialHasMore={true}
            />,
        );

        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        expect(mockHandleOpenEditModal).toHaveBeenCalledWith(mockReview);
    });

    it('should trigger handleOpenDeleteModal when delete button on review card is clicked', () => {
        render(
            <UserReviewsInteractive
                initialReviews={[mockReview]}
                initialBooksMap={{}}
                initialHasMore={true}
            />,
        );

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);

        expect(mockHandleOpenDeleteModal).toHaveBeenCalledWith('rev-1');
    });

    it('should render DeleteReviewModal and handle interactions when isDeleteModalOpen is true', () => {
        (useUserReviews as jest.Mock).mockReturnValue({
            ...defaultHookValues,
            isDeleteModalOpen: true,
        });

        render(
            <UserReviewsInteractive
                initialReviews={[mockReview]}
                initialBooksMap={{}}
                initialHasMore={true}
            />,
        );

        expect(screen.getByTestId('delete-modal')).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /close delete/i });
        fireEvent.click(closeButton);
        expect(mockHandleCloseDeleteModal).toHaveBeenCalledTimes(1);

        const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
        fireEvent.click(confirmButton);
        expect(mockHandleConfirmDelete).toHaveBeenCalledTimes(1);
    });

    it('should render ReviewFormModal and handle closing when isEditModalOpen is true', () => {
        (useUserReviews as jest.Mock).mockReturnValue({
            ...defaultHookValues,
            isEditModalOpen: true,
            selectedEditReview: mockReview,
        });

        render(
            <UserReviewsInteractive
                initialReviews={[mockReview]}
                initialBooksMap={{}}
                initialHasMore={true}
            />,
        );

        expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
        expect(screen.getByText(/Editing Review rev-1 for Book book-1/i)).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /close edit/i });
        fireEvent.click(closeButton);
        expect(mockHandleCloseEditModal).toHaveBeenCalledTimes(1);
    });
});
