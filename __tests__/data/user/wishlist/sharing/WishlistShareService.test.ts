import {
    fetchWishlistByToken,
    fetchWishlistByUsername,
} from '@/data/user/wishlist/sharing/WishlistShareRepository';
import {
    getPublicWishlistByUsername,
    getWishlistByShareToken,
} from '@/data/user/wishlist/sharing/WishlistShareService';
import { sanitizeSupabaseError } from '@/utils/errors/SupabaseErrorHandler';

jest.mock('@/data/user/wishlist/sharing/WishlistShareRepository', () => ({
    fetchWishlistByUsername: jest.fn(),
    fetchWishlistByToken: jest.fn(),
}));

jest.mock('@/utils/errors/SupabaseErrorHandler', () => ({
    sanitizeSupabaseError: jest.fn((err: unknown) => {
        if (err instanceof Error) return err.message;
        return String(err);
    }),
}));

describe('WishlistShareService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPublicWishlistByUsername', () => {
        const mockFetchWishlistByUsername = fetchWishlistByUsername as jest.MockedFunction<
            typeof fetchWishlistByUsername
        >;

        it('should successfully return data for a valid username', async () => {
            const mockData = {
                user_id: '123',
                username: 'test',
                first_name: 'A',
                last_name: 'B',
                wishlist: [],
            };
            mockFetchWishlistByUsername.mockResolvedValue({ data: mockData, error: null });

            const result = await getPublicWishlistByUsername('test');

            expect(mockFetchWishlistByUsername).toHaveBeenCalledWith('test');
            expect(result).toEqual({ data: mockData, error: null });
        });

        it('should return validation error if username is empty', async () => {
            const result = await getPublicWishlistByUsername('');

            expect(mockFetchWishlistByUsername).not.toHaveBeenCalled();
            expect(result).toEqual({ data: null, error: 'Invalid username provided.' });
        });

        it('should return validation error if username is only whitespace', async () => {
            const result = await getPublicWishlistByUsername('   ');

            expect(mockFetchWishlistByUsername).not.toHaveBeenCalled();
            expect(result).toEqual({ data: null, error: 'Invalid username provided.' });
        });

        it('should catch exceptions and return sanitized error', async () => {
            mockFetchWishlistByUsername.mockRejectedValue(new Error('Repo failure'));

            const result = await getPublicWishlistByUsername('valid-user');

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('Repo failure'));
            expect(result).toEqual({ data: null, error: 'Repo failure' });
        });
    });

    describe('getWishlistByShareToken', () => {
        const mockFetchWishlistByToken = fetchWishlistByToken as jest.MockedFunction<
            typeof fetchWishlistByToken
        >;

        it('should successfully return data for a valid token', async () => {
            const mockData = {
                user_id: '456',
                username: 'tokentest',
                first_name: 'C',
                last_name: 'D',
                wishlist: [],
            };
            mockFetchWishlistByToken.mockResolvedValue({ data: mockData, error: null });

            const result = await getWishlistByShareToken('valid-token-string');

            expect(mockFetchWishlistByToken).toHaveBeenCalledWith('valid-token-string');
            expect(result).toEqual({ data: mockData, error: null });
        });

        it('should return validation error if token is empty', async () => {
            const result = await getWishlistByShareToken('');

            expect(mockFetchWishlistByToken).not.toHaveBeenCalled();
            expect(result).toEqual({ data: null, error: 'Invalid share token provided.' });
        });

        it('should return validation error if token is only whitespace', async () => {
            const result = await getWishlistByShareToken('   ');

            expect(mockFetchWishlistByToken).not.toHaveBeenCalled();
            expect(result).toEqual({ data: null, error: 'Invalid share token provided.' });
        });

        it('should catch exceptions and return sanitized error', async () => {
            mockFetchWishlistByToken.mockRejectedValue(new Error('Token query failure'));

            const result = await getWishlistByShareToken('valid-token-string');

            expect(sanitizeSupabaseError).toHaveBeenCalledWith(new Error('Token query failure'));
            expect(result).toEqual({ data: null, error: 'Token query failure' });
        });
    });
});
