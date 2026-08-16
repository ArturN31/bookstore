import { deleteReviewAction, fetchUserReviewsAction } from '@/data/books/reviews/ReviewService';
import { useUserReviews } from '@/data/books/reviews/useUserReviews';
import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/data/books/reviews/ReviewService', () => ({
    deleteReviewAction: jest.fn(),
    fetchUserReviewsAction: jest.fn(),
}));

describe('useUserReviews Hook', () => {
    const mockRefresh = jest.fn();
    const mockDeleteReviewAction = deleteReviewAction as jest.MockedFunction<
        typeof deleteReviewAction
    >;
    const mockFetchUserReviewsAction = fetchUserReviewsAction as jest.MockedFunction<
        typeof fetchUserReviewsAction
    >;

    const initialReviews: Review[] = [
        {
            id: '1',
            book_id: 'book-1',
            rating: 5,
            review: 'Great book!',
            created_at: '',
            updated_at: '',
            user_id: '',
            username: '',
        },
    ];
    const initialBooksMap: Record<string | number, Partial<BookDB> | null> = {
        '1': { id: 'book-1', title: 'Book One' },
    };
    const initialHasMore = true;

    let mockObserverCallback: IntersectionObserverCallback;
    const mockObserve = jest.fn();
    const mockUnobserve = jest.fn();
    const mockDisconnect = jest.fn();

    let consoleErrorSpy: jest.SpyInstance;

    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        (useRouter as jest.Mock).mockReturnValue({
            refresh: mockRefresh,
        });

        window.IntersectionObserver = class {
            constructor(callback: IntersectionObserverCallback) {
                mockObserverCallback = callback;
            }
            observe = mockObserve;
            unobserve = mockUnobserve;
            disconnect = mockDisconnect;
        } as unknown as typeof IntersectionObserver;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should initialize with provided props', () => {
        const { result } = renderHook(() =>
            useUserReviews({
                initialReviews,
                initialBooksMap,
                initialHasMore,
            }),
        );

        expect(result.current.reviews).toEqual(initialReviews);
        expect(result.current.booksMap).toEqual(initialBooksMap);
        expect(result.current.hasMore).toBe(true);
        expect(result.current.isLoadingMore).toBe(false);
        expect(result.current.isDeleteModalOpen).toBe(false);
        expect(result.current.isEditModalOpen).toBe(false);
        expect(result.current.selectedEditReview).toBeNull();
    });

    it('should update state when initialReviews prop changes', () => {
        const { result, rerender } = renderHook(
            (props: {
                initialReviews: Review[];
                initialBooksMap: Record<string | number, Partial<BookDB> | null>;
                initialHasMore: boolean;
            }) => useUserReviews(props),
            {
                initialProps: {
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                },
            },
        );

        const newReviews: Review[] = [
            {
                id: '2',
                book_id: 'book-2',
                rating: 4,
                review: 'Good',
                created_at: '',
                updated_at: '',
                user_id: '',
                username: '',
            },
        ];
        const newBooksMap: Record<string | number, Partial<BookDB> | null> = {
            '2': { id: 'book-2', title: 'Book Two' },
        };

        rerender({
            initialReviews: newReviews,
            initialBooksMap: newBooksMap,
            initialHasMore: false,
        });

        expect(result.current.reviews).toEqual(newReviews);
        expect(result.current.booksMap).toEqual(newBooksMap);
        expect(result.current.hasMore).toBe(false);
    });

    describe('Delete Modal & Actions', () => {
        it('should open and close delete modal correctly', () => {
            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            act(() => {
                result.current.handleOpenDeleteModal('1');
            });

            expect(result.current.isDeleteModalOpen).toBe(true);

            act(() => {
                result.current.handleCloseDeleteModal();
            });

            expect(result.current.isDeleteModalOpen).toBe(false);
        });

        it('should successfully confirm delete, filter reviews, and refresh router', async () => {
            mockDeleteReviewAction.mockResolvedValueOnce({ success: true });

            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            act(() => {
                result.current.handleOpenDeleteModal('1');
            });

            await act(async () => {
                await result.current.handleConfirmDelete();
            });

            expect(mockDeleteReviewAction).toHaveBeenCalledWith('1');
            expect(result.current.reviews).toHaveLength(0);
            expect(mockRefresh).toHaveBeenCalled();
            expect(result.current.isDeleteModalOpen).toBe(false);
        });

        it('should catch and log error if deleteReviewAction throws', async () => {
            const testError = new Error('Deletion failed');
            mockDeleteReviewAction.mockRejectedValueOnce(testError);

            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            act(() => {
                result.current.handleOpenDeleteModal('1');
            });

            await act(async () => {
                await result.current.handleConfirmDelete();
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[useUserReviews] Failed to delete review:',
                testError,
            );
            expect(result.current.isDeleteModalOpen).toBe(false);
            expect(result.current.reviews).toHaveLength(1);
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it('should do nothing on confirm delete if selectedDeleteId is null', async () => {
            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            await act(async () => {
                await result.current.handleConfirmDelete();
            });

            expect(mockDeleteReviewAction).not.toHaveBeenCalled();
        });
    });

    describe('Edit Modal & Actions', () => {
        it('should open edit modal and set selected edit review correctly', () => {
            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            act(() => {
                result.current.handleOpenEditModal('1');
            });

            expect(result.current.isEditModalOpen).toBe(true);
            expect(result.current.selectedEditReview).toEqual({
                id: '1',
                book_id: 'book-1',
                rating: 5,
                review: 'Great book!',
            });
        });

        it('should not open edit modal if review id is not found', () => {
            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            act(() => {
                result.current.handleOpenEditModal('999');
            });

            expect(result.current.isEditModalOpen).toBe(false);
            expect(result.current.selectedEditReview).toBeNull();
        });

        it('should close edit modal and clear selected review after timeout', () => {
            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            act(() => {
                result.current.handleOpenEditModal('1');
            });

            expect(result.current.isEditModalOpen).toBe(true);

            act(() => {
                result.current.handleCloseEditModal();
            });

            expect(result.current.isEditModalOpen).toBe(false);
            expect(result.current.selectedEditReview).not.toBeNull();

            act(() => {
                jest.advanceTimersByTime(300);
            });

            expect(result.current.selectedEditReview).toBeNull();
        });
    });

    describe('Infinite Scroll & loadMoreReviews', () => {
        it('should fetch more reviews, filter duplicates, and update state successfully', async () => {
            const nextPageReviews: Review[] = [
                {
                    id: '1',
                    book_id: 'book-1',
                    rating: 5,
                    review: 'Duplicate',
                    created_at: '',
                    updated_at: '',
                    user_id: '',
                    username: '',
                },
                {
                    id: '2',
                    book_id: 'book-2',
                    rating: 4,
                    review: 'New review',
                    created_at: '',
                    updated_at: '',
                    user_id: '',
                    username: '',
                },
            ];
            const nextPageBooksMap: Record<string | number, Partial<BookDB> | null> = {
                '2': { id: 'book-2', title: 'Book Two' },
            };

            mockFetchUserReviewsAction.mockResolvedValueOnce({
                reviews: nextPageReviews,
                booksMap: nextPageBooksMap,
                hasMore: false,
                error: null,
            });

            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            const divElement = document.createElement('div');
            act(() => {
                result.current.observerTarget(divElement);
            });

            await act(async () => {
                if (typeof mockObserverCallback === 'function') {
                    mockObserverCallback(
                        [{ isIntersecting: true } as IntersectionObserverEntry],
                        {} as IntersectionObserver,
                    );
                }
            });

            expect(mockFetchUserReviewsAction).toHaveBeenCalledWith(2);
            expect(result.current.reviews).toEqual([
                {
                    id: '1',
                    book_id: 'book-1',
                    rating: 5,
                    review: 'Great book!',
                    created_at: '',
                    updated_at: '',
                    user_id: '',
                    username: '',
                },
                {
                    id: '2',
                    book_id: 'book-2',
                    rating: 4,
                    review: 'New review',
                    created_at: '',
                    updated_at: '',
                    user_id: '',
                    username: '',
                },
            ]);
            expect(result.current.booksMap).toEqual({
                '1': { id: 'book-1', title: 'Book One' },
                '2': { id: 'book-2', title: 'Book Two' },
            });
            expect(result.current.hasMore).toBe(false);
        });

        it('should not fetch more if fetchUserReviewsAction returns an error', async () => {
            mockFetchUserReviewsAction.mockResolvedValueOnce({
                reviews: [],
                booksMap: {},
                hasMore: true,
                error: 'Failed to fetch',
            });

            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore,
                }),
            );

            const divElement = document.createElement('div');
            act(() => {
                result.current.observerTarget(divElement);
            });

            await act(async () => {
                if (typeof mockObserverCallback === 'function') {
                    mockObserverCallback(
                        [{ isIntersecting: true } as IntersectionObserverEntry],
                        {} as IntersectionObserver,
                    );
                }
            });

            expect(mockFetchUserReviewsAction).toHaveBeenCalledWith(2);
            expect(result.current.reviews).toEqual(initialReviews);
        });

        it('should not fetch more if hasMore is false', async () => {
            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore: false,
                }),
            );

            const divElement = document.createElement('div');
            act(() => {
                result.current.observerTarget(divElement);
            });

            await act(async () => {
                if (typeof mockObserverCallback === 'function') {
                    mockObserverCallback(
                        [{ isIntersecting: true } as IntersectionObserverEntry],
                        {} as IntersectionObserver,
                    );
                }
            });

            expect(mockFetchUserReviewsAction).not.toHaveBeenCalled();
        });

        it('should not fetch more if already loading more', async () => {
            let resolveFetch!: (value: Awaited<ReturnType<typeof fetchUserReviewsAction>>) => void;
            const fetchPromise = new Promise<Awaited<ReturnType<typeof fetchUserReviewsAction>>>(
                (resolve) => {
                    resolveFetch = resolve;
                },
            );
            mockFetchUserReviewsAction.mockReturnValueOnce(fetchPromise);

            const { result } = renderHook(() =>
                useUserReviews({
                    initialReviews,
                    initialBooksMap,
                    initialHasMore: true,
                }),
            );

            // Start first load
            act(() => {
                void result.current.loadMoreReviews();
            });

            expect(mockFetchUserReviewsAction).toHaveBeenCalledTimes(1);
            expect(result.current.isLoadingMore).toBe(true);

            // Trigger loadMoreReviews again while isLoadingMore is true
            await act(async () => {
                await result.current.loadMoreReviews();
            });

            expect(mockFetchUserReviewsAction).toHaveBeenCalledTimes(1);

            // Resolve promise
            await act(async () => {
                resolveFetch({
                    reviews: [],
                    booksMap: {},
                    hasMore: false,
                    error: null,
                });
            });
        });
    });
});
