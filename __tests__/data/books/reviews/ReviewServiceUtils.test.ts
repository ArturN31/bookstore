import {
    verifyReviewForDeletion,
    revalidateServiceCaches,
} from '@/data/books/reviews/ReviewServiceUtils';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { recordSecurityAuditLog } from '@/utils/security/securityAuditLogger';
import { revalidatePath, revalidateTag } from 'next/cache';

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(),
}));

jest.mock('@/utils/security/securityAuditLogger', () => ({
    recordSecurityAuditLog: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

describe('ReviewServiceUtils', () => {
    const mockSafeSupabaseQuery = safeSupabaseQuery as unknown as jest.Mock;
    const mockRecordSecurityAuditLog = recordSecurityAuditLog as unknown as jest.Mock;
    const mockRevalidatePath = revalidatePath as unknown as jest.Mock;
    const mockRevalidateTag = revalidateTag as unknown as jest.Mock;

    let mockMaybeSingle: jest.Mock;
    let mockEq: jest.Mock;
    let mockSelect: jest.Mock;
    let mockFrom: jest.Mock;
    let mockSupabase: {
        from: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockMaybeSingle = jest.fn();
        mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
        mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        mockSupabase = {
            from: mockFrom,
        };

        mockSafeSupabaseQuery.mockImplementation(async (queryFn: () => Promise<unknown>) => {
            const data = await queryFn();
            return { data, error: null };
        });
    });

    describe('verifyReviewForDeletion', () => {
        it('should return isValid false and record security audit log when review data is missing', async () => {
            mockMaybeSingle.mockResolvedValueOnce(null);

            const result = await verifyReviewForDeletion(
                mockSupabase as unknown as Parameters<typeof verifyReviewForDeletion>[0],
                'rev-1',
                'user-123',
            );

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                'user-123',
                {
                    operation: 'verifyReviewForDeletion_unauthorized',
                    reviewId: 'rev-1',
                },
            );
            expect(result).toEqual({ isValid: false });
        });

        it('should return isValid false and record security audit log when review user_id does not match', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                user_id: 'other-user',
                book_id: 'book-1',
            });

            const result = await verifyReviewForDeletion(
                mockSupabase as unknown as Parameters<typeof verifyReviewForDeletion>[0],
                'rev-1',
                'user-123',
            );

            expect(mockRecordSecurityAuditLog).toHaveBeenCalledWith(
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                'user-123',
                {
                    operation: 'verifyReviewForDeletion_unauthorized',
                    reviewId: 'rev-1',
                },
            );
            expect(result).toEqual({ isValid: false });
        });

        it('should return isValid true and bookId when review exists and user_id matches', async () => {
            mockMaybeSingle.mockResolvedValueOnce({
                user_id: 'user-123',
                book_id: 'book-1',
            });

            const result = await verifyReviewForDeletion(
                mockSupabase as unknown as Parameters<typeof verifyReviewForDeletion>[0],
                'rev-1',
                'user-123',
            );

            expect(mockRecordSecurityAuditLog).not.toHaveBeenCalled();
            expect(result).toEqual({ isValid: true, bookId: 'book-1' });
        });
    });

    describe('revalidateServiceCaches', () => {
        it('should revalidate default tags and paths when bookId is not provided', async () => {
            revalidateServiceCaches();

            expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
            expect(mockRevalidateTag).toHaveBeenCalledWith('reviews', 'max');
            expect(mockRevalidateTag).toHaveBeenCalledWith('books', 'max');

            expect(mockRevalidatePath).toHaveBeenCalledTimes(4);
            expect(mockRevalidatePath).toHaveBeenCalledWith('/user/reviews/[username]', 'page');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/book/[slug]', 'page');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'page');
        });

        it('should revalidate specific book tags and paths when bookId is provided', async () => {
            revalidateServiceCaches('book-1');

            expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
            expect(mockRevalidateTag).toHaveBeenCalledWith('reviews', 'max');
            expect(mockRevalidateTag).toHaveBeenCalledWith('books', 'max');
            expect(mockRevalidateTag).toHaveBeenCalledWith('reviews-book-1', 'max');

            expect(mockRevalidatePath).toHaveBeenCalledTimes(5);
            expect(mockRevalidatePath).toHaveBeenCalledWith('/user/reviews/[username]', 'page');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/book/[slug]', 'page');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/book/book-1', 'page');
            expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'page');
        });
    });
});
