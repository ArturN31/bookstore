import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn(),
}));

describe('safeSupabaseQuery', () => {
    const mockSanitizeSupabaseError = sanitizeSupabaseError as jest.MockedFunction<
        typeof sanitizeSupabaseError
    >;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return data and null error when the query succeeds with data', async () => {
        const mockData = [{ id: '1', title: 'The Great Gatsby' }];
        const mockQueryFn = jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
        });

        const result = await safeSupabaseQuery(mockQueryFn);

        expect(result).toEqual({
            data: mockData,
            error: null,
        });
        expect(mockSanitizeSupabaseError).not.toHaveBeenCalled();
    });

    it('should sanitize and return the error when queryFn returns an error', async () => {
        const mockRawError = {
            code: '23505',
            message: 'duplicate key value violates unique constraint',
            details: '',
        };
        const mockQueryFn = jest.fn().mockResolvedValue({
            data: null,
            error: mockRawError,
        });

        mockSanitizeSupabaseError.mockReturnValue(
            'This record already exists. Please use a different value.',
        );

        const result = await safeSupabaseQuery(mockQueryFn);

        expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(mockRawError);
        expect(result).toEqual({
            data: null,
            error: 'This record already exists. Please use a different value.',
        });
    });

    it('should return "No data returned." error when data is null and error is null', async () => {
        const mockQueryFn = jest.fn().mockResolvedValue({
            data: null,
            error: null,
        });

        const result = await safeSupabaseQuery(mockQueryFn);

        expect(result).toEqual({
            data: null,
            error: 'No data returned.',
        });
        expect(mockSanitizeSupabaseError).not.toHaveBeenCalled();
    });

    it('should catch thrown exceptions and pass them through sanitizeSupabaseError', async () => {
        const mockThrownError = new Error('Network connection failed');
        const mockQueryFn = jest.fn().mockRejectedValue(mockThrownError);

        mockSanitizeSupabaseError.mockReturnValue(
            'An unexpected error occurred. We are looking into it.',
        );

        const result = await safeSupabaseQuery(mockQueryFn);

        expect(mockSanitizeSupabaseError).toHaveBeenCalledWith(mockThrownError);
        expect(result).toEqual({
            data: null,
            error: 'An unexpected error occurred. We are looking into it.',
        });
    });
});
