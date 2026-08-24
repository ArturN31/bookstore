import { SupabaseClient } from '@supabase/supabase-js';
import * as service from '@/app/dev-tools/actions/DevToolsService';
import * as repository from '@/app/dev-tools/actions/DevToolsRepository';
import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';
import { generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';

jest.mock('@faker-js/faker/locale/en_GB', () => ({
    faker: {
        number: {
            int: jest.fn().mockReturnValue(1),
        },
    },
}));

jest.mock('@/app/dev-tools/actions/DevToolsRepository');
jest.mock('@/utils/db/dbSeed/generateOrders');
jest.mock('@/utils/db/dbSeed/generateReview');
jest.mock('@/utils/db/dbSeed/generateDiscounts');
jest.mock('@/utils/db/dbSeed/generateBook');

describe('DevToolsService', () => {
    let supabase: SupabaseClient;

    beforeEach(() => {
        supabase = {} as SupabaseClient;
        jest.clearAllMocks();
    });

    describe('addSales', () => {
        it('should successfully add sales', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: [{ id: 'discount-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);

            jest.mocked(generateOrdersAndItems).mockReturnValueOnce({
                orders: [{ id: 'order-1' }],
                items: [{ id: 'item-1' }],
                orderDiscounts: [{ id: 'order-discount-1' }],
            } as unknown as ReturnType<typeof generateOrdersAndItems>);

            jest.mocked(repository.insertOrders).mockResolvedValueOnce({ data: [], error: null });
            jest.mocked(repository.insertOrderItems).mockResolvedValueOnce({
                data: [],
                error: null,
            });
            jest.mocked(repository.insertOrderDiscounts).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const result = await service.addSales(supabase);

            expect(result.success).toBe(true);
            expect(repository.insertOrders).toHaveBeenCalled();
            expect(repository.insertOrderItems).toHaveBeenCalled();
            expect(repository.insertOrderDiscounts).toHaveBeenCalled();
        });

        it('should handle null discounts data gracefully and default to empty array', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);

            jest.mocked(generateOrdersAndItems).mockReturnValueOnce({
                orders: [{ id: 'order-1' }],
                items: [{ id: 'item-1' }],
                orderDiscounts: [],
            } as unknown as ReturnType<typeof generateOrdersAndItems>);

            jest.mocked(repository.insertOrders).mockResolvedValueOnce({ data: [], error: null });
            jest.mocked(repository.insertOrderItems).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const result = await service.addSales(supabase);
            expect(result.success).toBe(true);
        });

        it('should throw an error if fetching books fails', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: null,
                error: 'Fetch failed',
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: [{ id: 'discount-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);

            await expect(service.addSales(supabase)).rejects.toThrow('Fetch failed');
        });

        it('should throw an error if fetching discounts fails', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: null,
                error: 'Discount fetch failed',
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);

            await expect(service.addSales(supabase)).rejects.toThrow('Discount fetch failed');
        });

        it('should throw an error if catalog is empty', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: [],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: [],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);

            await expect(service.addSales(supabase)).rejects.toThrow(
                'Seed Failure: Catalog is empty.',
            );
        });

        it('should throw an error if inserting orders fails', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: [],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);
            jest.mocked(generateOrdersAndItems).mockReturnValueOnce({
                orders: [{ id: 'order-1' }],
                items: [],
                orderDiscounts: [],
            } as unknown as ReturnType<typeof generateOrdersAndItems>);
            jest.mocked(repository.insertOrders).mockResolvedValueOnce({
                data: null,
                error: 'Order insert failed',
            });

            await expect(service.addSales(supabase)).rejects.toThrow('Order insert failed');
        });

        it('should throw an error if inserting order items fails', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: [],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);
            jest.mocked(generateOrdersAndItems).mockReturnValueOnce({
                orders: [{ id: 'order-1' }],
                items: [{ id: 'item-1' }],
                orderDiscounts: [],
            } as unknown as ReturnType<typeof generateOrdersAndItems>);
            jest.mocked(repository.insertOrders).mockResolvedValueOnce({ data: [], error: null });
            jest.mocked(repository.insertOrderItems).mockResolvedValueOnce({
                data: null,
                error: 'Item insert failed',
            });

            await expect(service.addSales(supabase)).rejects.toThrow('Item insert failed');
        });
    });

    describe('seedDiscounts', () => {
        it('should successfully add discounts', async () => {
            jest.mocked(generateDiscounts).mockReturnValueOnce(
                [] as unknown as ReturnType<typeof generateDiscounts>,
            );
            jest.mocked(repository.insertDiscounts).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const result = await service.seedDiscounts(supabase);

            expect(result.success).toBe(true);
            expect(repository.insertDiscounts).toHaveBeenCalled();
        });

        it('should throw an error if inserting discounts fails', async () => {
            jest.mocked(generateDiscounts).mockReturnValueOnce(
                [] as unknown as ReturnType<typeof generateDiscounts>,
            );
            jest.mocked(repository.insertDiscounts).mockResolvedValueOnce({
                data: null,
                error: 'Discount insert error',
            });

            await expect(service.seedDiscounts(supabase)).rejects.toThrow('Discount insert error');
        });
    });

    describe('stockPurge', () => {
        it('should successfully set stock to 0', async () => {
            jest.mocked(repository.fetchBookIds).mockResolvedValueOnce({
                data: [{ id: 'book-1' }, { id: 'book-2' }],
                error: null,
            });
            jest.mocked(repository.updateBookStock).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const result = await service.stockPurge(supabase);

            expect(result.success).toBe(true);
            expect(repository.updateBookStock).toHaveBeenCalled();
        });

        it('should throw an error if inventory lookup fails or books are empty', async () => {
            jest.mocked(repository.fetchBookIds).mockResolvedValueOnce({
                data: null,
                error: 'Inventory lookup error',
            });

            await expect(service.stockPurge(supabase)).rejects.toThrow('Inventory lookup failed.');
        });

        it('should throw an error if inventory books list is empty', async () => {
            jest.mocked(repository.fetchBookIds).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            await expect(service.stockPurge(supabase)).rejects.toThrow('Inventory lookup failed.');
        });

        it('should throw an error if updating book stock fails', async () => {
            jest.mocked(repository.fetchBookIds).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            });
            jest.mocked(repository.updateBookStock).mockResolvedValueOnce({
                data: null,
                error: 'Stock update error',
            });

            await expect(service.stockPurge(supabase)).rejects.toThrow('Stock update error');
        });
    });

    describe('reviewBomb', () => {
        it('should successfully add reviews', async () => {
            jest.mocked(repository.fetchBooksForReviews).mockResolvedValueOnce({
                data: [{ id: 'book-1', title: 'Test Book' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForReviews>>);
            jest.mocked(repository.fetchUsersForReviews).mockResolvedValueOnce({
                data: [{ id: 'user-1', username: 'testuser' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForReviews>>);
            jest.mocked(generateReviewsArray).mockReturnValueOnce(
                [] as unknown as ReturnType<typeof generateReviewsArray>,
            );
            jest.mocked(repository.insertBookReviews).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const result = await service.reviewBomb(supabase);

            expect(result.success).toBe(true);
            expect(repository.insertBookReviews).toHaveBeenCalled();
        });

        it('should throw an error if fetching books for reviews fails', async () => {
            jest.mocked(repository.fetchBooksForReviews).mockResolvedValueOnce({
                data: null,
                error: 'Books error',
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForReviews>>);
            jest.mocked(repository.fetchUsersForReviews).mockResolvedValueOnce({
                data: [{ id: 'user-1', username: 'testuser' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForReviews>>);

            await expect(service.reviewBomb(supabase)).rejects.toThrow('Books error');
        });

        it('should throw an error if fetching users for reviews fails', async () => {
            jest.mocked(repository.fetchBooksForReviews).mockResolvedValueOnce({
                data: [{ id: 'book-1', title: 'Test Book' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForReviews>>);
            jest.mocked(repository.fetchUsersForReviews).mockResolvedValueOnce({
                data: null,
                error: 'Users error',
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForReviews>>);

            await expect(service.reviewBomb(supabase)).rejects.toThrow('Users error');
        });

        it('should throw an error if review data is missing or empty', async () => {
            jest.mocked(repository.fetchBooksForReviews).mockResolvedValueOnce({
                data: [],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForReviews>>);
            jest.mocked(repository.fetchUsersForReviews).mockResolvedValueOnce({
                data: [{ id: 'user-1', username: 'testuser' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForReviews>>);

            await expect(service.reviewBomb(supabase)).rejects.toThrow(
                'Seed Error: Required data for reviews is missing.',
            );
        });

        it('should throw an error if inserting book reviews fails', async () => {
            jest.mocked(repository.fetchBooksForReviews).mockResolvedValueOnce({
                data: [{ id: 'book-1', title: 'Test Book' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForReviews>>);
            jest.mocked(repository.fetchUsersForReviews).mockResolvedValueOnce({
                data: [{ id: 'user-1', username: 'testuser' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForReviews>>);
            jest.mocked(generateReviewsArray).mockReturnValueOnce(
                [] as unknown as ReturnType<typeof generateReviewsArray>,
            );
            jest.mocked(repository.insertBookReviews).mockResolvedValueOnce({
                data: null,
                error: 'Insert review error',
            });

            await expect(service.reviewBomb(supabase)).rejects.toThrow('Insert review error');
        });
    });

    describe('addCarts', () => {
        it('should successfully add carts', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: [{ id: 'user-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);
            jest.mocked(repository.insertShoppingCarts).mockResolvedValueOnce({
                data: [{ id: 'cart-1', user_id: 'user-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.insertShoppingCarts>>);
            jest.mocked(repository.insertShoppingCartItems).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const result = await service.addCarts(supabase);

            expect(result.success).toBe(true);
            expect(repository.insertShoppingCarts).toHaveBeenCalled();
            expect(repository.insertShoppingCartItems).toHaveBeenCalled();
        });

        it('should throw an error if cartErr is present when inserting shopping carts', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: [{ id: 'user-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);
            jest.mocked(repository.insertShoppingCarts).mockResolvedValueOnce({
                data: null,
                error: 'Database constraint violation',
            } as unknown as Awaited<ReturnType<typeof repository.insertShoppingCarts>>);

            await expect(service.addCarts(supabase)).rejects.toThrow(
                'Database constraint violation',
            );
        });

        it('should throw a default cart insert error if carts data is null and no error message', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: [{ id: 'user-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);
            jest.mocked(repository.insertShoppingCarts).mockResolvedValueOnce({
                data: null,
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.insertShoppingCarts>>);

            await expect(service.addCarts(supabase)).rejects.toThrow('Cart insert error');
        });

        it('should throw an error if fetching books for carts fails', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: null,
                error: 'Carts books error',
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: [{ id: 'user-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);

            await expect(service.addCarts(supabase)).rejects.toThrow('Carts books error');
        });

        it('should throw an error if fetching users for carts fails', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: null,
                error: 'Carts users error',
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);

            await expect(service.addCarts(supabase)).rejects.toThrow('Carts users error');
        });

        it('should throw an error if carts data is missing or empty', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: [{ id: 'user-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);

            await expect(service.addCarts(supabase)).rejects.toThrow('Data missing for carts.');
        });

        it('should throw an error if inserting shopping cart items fails', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: [{ id: 'user-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);
            jest.mocked(repository.insertShoppingCarts).mockResolvedValueOnce({
                data: [{ id: 'cart-1', user_id: 'user-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.insertShoppingCarts>>);
            jest.mocked(repository.insertShoppingCartItems).mockResolvedValueOnce({
                data: null,
                error: 'Cart items insert error',
            });

            await expect(service.addCarts(supabase)).rejects.toThrow('Cart items insert error');
        });
    });

    describe('addWishlists', () => {
        it('should successfully add wishlists', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: [{ id: 'book-1' }], error: null },
                { data: [{ id: 'user-1' }], error: null },
                { data: [], error: null },
            ] as unknown as Awaited<ReturnType<typeof repository.fetchWishlistContext>>);

            jest.mocked(repository.insertWishlistEntries).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            const result = await service.addWishlists(supabase);

            expect(result.success).toBe(true);
            expect(repository.insertWishlistEntries).toHaveBeenCalled();
        });

        it('should throw an error if fetching wishlist books fails', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: null, error: 'Wishlist books error' },
                { data: [{ id: 'user-1' }], error: null },
                { data: [], error: null },
            ] as unknown as Awaited<ReturnType<typeof repository.fetchWishlistContext>>);

            await expect(service.addWishlists(supabase)).rejects.toThrow('Wishlist books error');
        });

        it('should throw an error if fetching wishlist users fails', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: [{ id: 'book-1' }], error: null },
                { data: null, error: 'Wishlist users error' },
                { data: [], error: null },
            ] as unknown as Awaited<ReturnType<typeof repository.fetchWishlistContext>>);

            await expect(service.addWishlists(supabase)).rejects.toThrow('Wishlist users error');
        });

        it('should throw an error if fetching existing wishlists fails', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: [{ id: 'book-1' }], error: null },
                { data: [{ id: 'user-1' }], error: null },
                { data: null, error: 'Existing wishlist error' },
            ] as unknown as Awaited<ReturnType<typeof repository.fetchWishlistContext>>);

            await expect(service.addWishlists(supabase)).rejects.toThrow('Existing wishlist error');
        });

        it('should throw an error if wishlist data is missing', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: [], error: null },
                { data: [{ id: 'user-1' }], error: null },
                { data: [], error: null },
            ] as unknown as Awaited<ReturnType<typeof repository.fetchWishlistContext>>);

            await expect(service.addWishlists(supabase)).rejects.toThrow('Missing data.');
        });

        it('should throw an error if no more unique combinations are available', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: [{ id: 'book-1' }], error: null },
                { data: [{ id: 'user-1' }], error: null },
                { data: [{ user_id: 'user-1', book_id: 'book-1' }], error: null },
            ] as unknown as Awaited<ReturnType<typeof repository.fetchWishlistContext>>);

            await expect(service.addWishlists(supabase)).rejects.toThrow(
                'No more unique combinations available.',
            );
        });

        it('should throw an error if inserting wishlist entries fails', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: [{ id: 'book-1' }], error: null },
                { data: [{ id: 'user-1' }], error: null },
                { data: [], error: null },
            ] as unknown as Awaited<ReturnType<typeof repository.fetchWishlistContext>>);

            jest.mocked(repository.insertWishlistEntries).mockResolvedValueOnce({
                data: null,
                error: 'Insert wishlist error',
            });

            await expect(service.addWishlists(supabase)).rejects.toThrow('Insert wishlist error');
        });
    });

    describe('addBooks', () => {
        it('should successfully add books', async () => {
            jest.mocked(generateBooksArray).mockReturnValueOnce(
                [] as unknown as ReturnType<typeof generateBooksArray>,
            );
            jest.mocked(repository.insertBooks).mockResolvedValueOnce({ data: [], error: null });

            const result = await service.addBooks(supabase);

            expect(result.success).toBe(true);
            expect(repository.insertBooks).toHaveBeenCalled();
        });

        it('should throw an error if inserting books fails', async () => {
            jest.mocked(generateBooksArray).mockReturnValueOnce(
                [] as unknown as ReturnType<typeof generateBooksArray>,
            );
            jest.mocked(repository.insertBooks).mockResolvedValueOnce({
                data: null,
                error: 'Insert books error',
            });

            await expect(service.addBooks(supabase)).rejects.toThrow('Insert books error');
        });
    });
});
