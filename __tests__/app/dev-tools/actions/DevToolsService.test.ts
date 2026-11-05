import { SupabaseClient } from '@supabase/supabase-js';
import * as serviceModule from '@/app/dev-tools/actions/DevToolsService';
import type { AuthorizeWrite, CommandHandler } from '@/app/dev-tools/actions/DevToolsService';
import * as repository from '@/app/dev-tools/actions/DevToolsRepository';
import { generateOrdersAndItems } from '@/utils/db/dbSeed/generateOrders';
import { generateReviewsArray } from '@/utils/db/dbSeed/generateReview';
import { generateDiscounts } from '@/utils/db/dbSeed/generateDiscounts';
import { generateBooksArray } from '@/utils/db/dbSeed/generateBook';
import { naturalPairKey, normalizeNaturalKey } from '@/utils/db/dbSeed/candidatePlanning';

jest.mock('@faker-js/faker/locale/en_GB', () => {
    return {
        faker: {
            number: {
                int: jest.fn().mockReturnValue(1),
            },
        },
    };
});

jest.mock('@/app/dev-tools/actions/DevToolsRepository');
jest.mock('@/utils/db/dbSeed/generateOrders');
jest.mock('@/utils/db/dbSeed/generateReview');
jest.mock('@/utils/db/dbSeed/generateDiscounts');
jest.mock('@/utils/db/dbSeed/generateBook');

const createSalesBatch = (includeDiscount = false): ReturnType<typeof generateOrdersAndItems> =>
    ({
        orders: Array.from({ length: 10 }, (_, index) => ({ id: `order-${index}` })),
        items: Array.from({ length: 10 }, (_, index) => ({ id: `item-${index}` })),
        orderDiscounts: includeDiscount ? [{ id: 'order-discount-1' }] : [],
    }) as unknown as ReturnType<typeof generateOrdersAndItems>;

const createdRows = (count: number, prefix: string) =>
    Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index}` }));
const generatedReviews = () => createdRows(50, 'review');
const generatedBooks = () => createdRows(50, 'book');
const generatedDiscounts = () => createdRows(5, 'discount');
const cartUsers = Array.from({ length: 15 }, (_, index) => ({ id: `user-${index}` }));
const generatedCarts = () =>
    Array.from({ length: 15 }, (_, index) => ({
        id: `cart-${index}`,
        user_id: cartUsers[index].id,
    }));

const testWriteAuthorization: AuthorizeWrite = async () => {};
const withTestAuthorization =
    (command: CommandHandler) =>
    (supabase: SupabaseClient, authorizeWrite = testWriteAuthorization) =>
        command(supabase, authorizeWrite);
const service = {
    addSales: withTestAuthorization(serviceModule.addSales),
    seedDiscounts: withTestAuthorization(serviceModule.seedDiscounts),
    stockPurge: withTestAuthorization(serviceModule.stockPurge),
    reviewBomb: withTestAuthorization(serviceModule.reviewBomb),
    addCarts: withTestAuthorization(serviceModule.addCarts),
    addWishlists: withTestAuthorization(serviceModule.addWishlists),
    addBooks: withTestAuthorization(serviceModule.addBooks),
};

describe('DevToolsService', () => {
    let supabase: SupabaseClient;

    beforeEach(() => {
        supabase = {} as SupabaseClient;
        jest.clearAllMocks();
        jest.mocked(repository.fetchUsersForOrders).mockResolvedValue({
            data: [{ id: 'current-user' }],
            error: null,
        } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForOrders>>);
        jest.mocked(repository.fetchDiscountCodes).mockResolvedValue({
            data: [],
            error: null,
        });
        jest.mocked(repository.fetchBookNaturalKeys).mockResolvedValue({
            data: [],
            error: null,
        });
        jest.mocked(repository.fetchReviewNaturalKeys).mockResolvedValue({
            data: [],
            error: null,
        });
        jest.mocked(repository.deleteOrderDiscountsForOrders).mockResolvedValue({
            data: [],
            error: null,
        });
        jest.mocked(repository.deleteOrderItemsForOrders).mockResolvedValue({
            data: [],
            error: null,
        });
        jest.mocked(repository.deleteOrders).mockResolvedValue({
            data: [],
            error: null,
        });
        jest.mocked(repository.deleteShoppingCartItemsForCarts).mockResolvedValue({
            data: [],
            error: null,
        });
        jest.mocked(repository.deleteShoppingCarts).mockResolvedValue({
            data: [],
            error: null,
        });
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

            jest.mocked(generateOrdersAndItems).mockReturnValueOnce(createSalesBatch(true));

            jest.mocked(repository.insertOrders).mockResolvedValueOnce({
                data: createdRows(10, 'order'),
                error: null,
            });
            jest.mocked(repository.insertOrderItems).mockResolvedValueOnce({
                data: createdRows(10, 'item'),
                error: null,
            });
            jest.mocked(repository.insertOrderDiscounts).mockResolvedValueOnce({
                data: [{ id: 'order-discount-1' }],
                error: null,
            });

            const authorizeWrite = jest.fn().mockResolvedValue(undefined);
            const result = await service.addSales(supabase, authorizeWrite);

            expect(result.success).toBe(true);
            expect(authorizeWrite).toHaveBeenCalledTimes(1);
            expect(generateOrdersAndItems).toHaveBeenCalledWith(
                expect.any(Array),
                [{ id: 'current-user' }],
                expect.any(Number),
                expect.any(Number),
                expect.any(Array),
                expect.any(Number),
            );
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

            jest.mocked(generateOrdersAndItems).mockReturnValueOnce(createSalesBatch());

            jest.mocked(repository.insertOrders).mockResolvedValueOnce({
                data: createdRows(10, 'order'),
                error: null,
            });
            jest.mocked(repository.insertOrderItems).mockResolvedValueOnce({
                data: createdRows(10, 'item'),
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

        it('should throw an error if fetching current order users fails', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: [],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);
            jest.mocked(repository.fetchUsersForOrders).mockResolvedValueOnce({
                data: null,
                error: 'Users for orders lookup failed',
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForOrders>>);

            await expect(service.addSales(supabase)).rejects.toThrow(
                'Users for orders lookup failed',
            );
            expect(repository.insertOrders).not.toHaveBeenCalled();
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
            jest.mocked(generateOrdersAndItems).mockReturnValueOnce(createSalesBatch());
            jest.mocked(repository.insertOrders).mockResolvedValueOnce({
                data: null,
                error: 'Order insert failed',
            });

            await expect(service.addSales(supabase)).rejects.toThrow('Order insert failed');
            expect(repository.deleteOrders).not.toHaveBeenCalled();
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
            jest.mocked(generateOrdersAndItems).mockReturnValueOnce(createSalesBatch());
            jest.mocked(repository.insertOrders).mockResolvedValueOnce({
                data: createdRows(10, 'order'),
                error: null,
            });
            jest.mocked(repository.insertOrderItems).mockResolvedValueOnce({
                data: null,
                error: 'Item insert failed',
            });

            await expect(service.addSales(supabase)).rejects.toThrow(
                'Order generation failed: Order items insert failed: Item insert failed. Completed stages: orders. Generated order records were rolled back.',
            );
            expect(repository.deleteOrderDiscountsForOrders).toHaveBeenCalledWith(
                supabase,
                expect.arrayContaining(Array.from({ length: 10 }, (_, index) => `order-${index}`)),
            );
            expect(repository.deleteOrderItemsForOrders).toHaveBeenCalled();
            expect(repository.deleteOrders).toHaveBeenCalled();
        });

        it('reports order cleanup failures after a dependent write fails', async () => {
            jest.mocked(repository.fetchAllBooks).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllBooks>>);
            jest.mocked(repository.fetchAllDiscounts).mockResolvedValueOnce({
                data: [],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchAllDiscounts>>);
            jest.mocked(generateOrdersAndItems).mockReturnValueOnce(createSalesBatch());
            jest.mocked(repository.insertOrders).mockResolvedValueOnce({
                data: createdRows(10, 'order'),
                error: null,
            });
            jest.mocked(repository.insertOrderItems).mockResolvedValueOnce({
                data: null,
                error: 'Item insert failed',
            });
            jest.mocked(repository.deleteOrders).mockResolvedValueOnce({
                data: null,
                error: 'Order cleanup denied',
            });

            await expect(service.addSales(supabase)).rejects.toThrow(
                'Cleanup was incomplete (order cleanup: Order cleanup denied); verify these records before retrying.',
            );
        });
    });

    describe('seedDiscounts', () => {
        it('should successfully add discounts', async () => {
            jest.mocked(generateDiscounts).mockReturnValueOnce(
                generatedDiscounts() as unknown as ReturnType<typeof generateDiscounts>,
            );
            jest.mocked(repository.insertDiscounts).mockResolvedValueOnce({
                data: generatedDiscounts(),
                error: null,
            });

            const result = await service.seedDiscounts(supabase);

            expect(result.success).toBe(true);
            expect(repository.fetchDiscountCodes).toHaveBeenCalledWith(supabase);
            expect(generateDiscounts).toHaveBeenCalledWith(5, []);
            expect(repository.insertDiscounts).toHaveBeenCalled();
        });

        it('passes normalized existing codes to the discount planner', async () => {
            jest.mocked(repository.fetchDiscountCodes).mockResolvedValueOnce({
                data: [{ code: ' summer  sale ' }],
                error: null,
            });
            jest.mocked(generateDiscounts).mockReturnValueOnce(
                generatedDiscounts() as unknown as ReturnType<typeof generateDiscounts>,
            );
            jest.mocked(repository.insertDiscounts).mockResolvedValueOnce({
                data: generatedDiscounts(),
                error: null,
            });

            await service.seedDiscounts(supabase);

            expect(generateDiscounts).toHaveBeenCalledWith(5, ['summer sale']);
        });

        it('avoids duplicate discount codes across sequential command runs', async () => {
            const candidates = Array.from({ length: 10 }, (_, index) => ({
                code: `SAVE_${index}`,
                type: 'percentage' as const,
                value: 10,
                is_active: true as const,
                end_date: '2027-01-01T00:00:00.000Z',
            }));
            const storedCodes: string[] = [];
            jest.mocked(repository.fetchDiscountCodes).mockImplementation(async () => ({
                data: storedCodes.map((code) => ({ code })),
                error: null,
            }));
            jest.mocked(generateDiscounts).mockImplementation(
                (_count, existingKeys = []) =>
                    candidates
                        .filter(({ code }) => !new Set(existingKeys).has(normalizeNaturalKey(code)))
                        .slice(0, 5) as ReturnType<typeof generateDiscounts>,
            );
            jest.mocked(repository.insertDiscounts).mockImplementation(
                async (_client, discounts) => {
                    const inserted = discounts as ReturnType<typeof generateDiscounts>;
                    storedCodes.push(...inserted.map(({ code }) => code));
                    return { data: inserted, error: null };
                },
            );

            await service.seedDiscounts(supabase);
            await service.seedDiscounts(supabase);

            expect(new Set(storedCodes.map(normalizeNaturalKey)).size).toBe(10);
        });

        it('should throw an error if inserting discounts fails', async () => {
            jest.mocked(generateDiscounts).mockReturnValueOnce(
                generatedDiscounts() as unknown as ReturnType<typeof generateDiscounts>,
            );
            jest.mocked(repository.insertDiscounts).mockResolvedValueOnce({
                data: null,
                error: 'Discount insert error',
            });

            await expect(service.seedDiscounts(supabase)).rejects.toThrow('Discount insert error');
        });

        it('does not authorize a write when discount preflight fails', async () => {
            jest.mocked(repository.fetchDiscountCodes).mockResolvedValueOnce({
                data: null,
                error: 'Discount lookup failed',
            });
            const authorizeWrite = jest.fn().mockResolvedValue(undefined);

            await expect(service.seedDiscounts(supabase, authorizeWrite)).rejects.toThrow(
                'Discount lookup failed',
            );

            expect(authorizeWrite).not.toHaveBeenCalled();
            expect(repository.insertDiscounts).not.toHaveBeenCalled();
        });

        it('does not write when rate authorization rejects the command', async () => {
            jest.mocked(generateDiscounts).mockReturnValueOnce(
                generatedDiscounts() as unknown as ReturnType<typeof generateDiscounts>,
            );
            const authorizeWrite: AuthorizeWrite = jest
                .fn()
                .mockRejectedValue(new Error('Rate limit exceeded'));

            await expect(service.seedDiscounts(supabase, authorizeWrite)).rejects.toThrow(
                'Rate limit exceeded',
            );

            expect(repository.insertDiscounts).not.toHaveBeenCalled();
        });
    });

    describe('stockPurge', () => {
        it('should successfully set stock to 0', async () => {
            jest.mocked(repository.fetchBookIds).mockResolvedValueOnce({
                data: [{ id: 'book-1' }, { id: 'book-2' }],
                error: null,
            });
            jest.mocked(repository.updateBookStock).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
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

            await expect(service.stockPurge(supabase)).rejects.toThrow('Inventory lookup error');
        });

        it('should throw an error if inventory books list is empty', async () => {
            jest.mocked(repository.fetchBookIds).mockResolvedValueOnce({
                data: [],
                error: null,
            });

            await expect(service.stockPurge(supabase)).rejects.toThrow(
                'Inventory lookup returned no books.',
            );
        });

        it('should throw an error if updating book stock fails', async () => {
            jest.mocked(repository.fetchBookIds).mockResolvedValueOnce({
                data: [{ id: 'book-1' }, { id: 'book-2' }],
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
                generatedReviews() as unknown as ReturnType<typeof generateReviewsArray>,
            );
            jest.mocked(repository.insertBookReviews).mockResolvedValueOnce({
                data: generatedReviews(),
                error: null,
            });

            const result = await service.reviewBomb(supabase);

            expect(result.success).toBe(true);
            expect(repository.fetchReviewNaturalKeys).toHaveBeenCalledWith(supabase);
            expect(generateReviewsArray).toHaveBeenCalledWith(
                expect.any(Array),
                50,
                expect.any(Array),
                [],
            );
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

        it('passes existing review pairs to the review planner', async () => {
            jest.mocked(repository.fetchBooksForReviews).mockResolvedValueOnce({
                data: [{ id: 'book-1', title: 'Test Book' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForReviews>>);
            jest.mocked(repository.fetchUsersForReviews).mockResolvedValueOnce({
                data: [{ id: 'user-1', username: 'testuser' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForReviews>>);
            jest.mocked(repository.fetchReviewNaturalKeys).mockResolvedValueOnce({
                data: [{ user_id: 'user-1', book_id: 'book-1' }],
                error: null,
            });
            jest.mocked(generateReviewsArray).mockReturnValueOnce(
                generatedReviews() as unknown as ReturnType<typeof generateReviewsArray>,
            );
            jest.mocked(repository.insertBookReviews).mockResolvedValueOnce({
                data: generatedReviews(),
                error: null,
            });

            await service.reviewBomb(supabase);

            expect(generateReviewsArray).toHaveBeenCalledWith(
                expect.any(Array),
                50,
                expect.any(Array),
                ['["user-1","book-1"]'],
            );
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
                data: cartUsers,
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);
            jest.mocked(repository.insertShoppingCarts).mockResolvedValueOnce({
                data: generatedCarts(),
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.insertShoppingCarts>>);
            jest.mocked(repository.insertShoppingCartItems).mockResolvedValueOnce({
                data: createdRows(15, 'cart-item'),
                error: null,
            });

            const authorizeWrite = jest.fn().mockResolvedValue(undefined);
            const result = await service.addCarts(supabase, authorizeWrite);

            expect(result.success).toBe(true);
            expect(authorizeWrite).toHaveBeenCalledTimes(1);
            expect(repository.insertShoppingCarts).toHaveBeenCalled();
            expect(repository.insertShoppingCartItems).toHaveBeenCalled();
        });

        it('should throw an error if cartErr is present when inserting shopping carts', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: cartUsers,
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);
            jest.mocked(repository.insertShoppingCarts).mockResolvedValueOnce({
                data: null,
                error: 'Database constraint violation',
            } as unknown as Awaited<ReturnType<typeof repository.insertShoppingCarts>>);

            await expect(service.addCarts(supabase)).rejects.toThrow(
                'Database constraint violation',
            );
            expect(repository.deleteShoppingCarts).not.toHaveBeenCalled();
            expect(repository.deleteShoppingCartItemsForCarts).not.toHaveBeenCalled();
        });

        it('should throw a default cart insert error if carts data is null and no error message', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: cartUsers,
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
                data: cartUsers,
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
                data: cartUsers,
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
                data: cartUsers,
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);
            jest.mocked(repository.insertShoppingCarts).mockResolvedValueOnce({
                data: generatedCarts(),
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.insertShoppingCarts>>);
            jest.mocked(repository.insertShoppingCartItems).mockResolvedValueOnce({
                data: null,
                error: 'Cart items insert error',
            });

            await expect(service.addCarts(supabase)).rejects.toThrow(
                'Cart generation failed: Cart item insert failed: Cart items insert error. Generated carts were rolled back.',
            );
            expect(repository.deleteShoppingCartItemsForCarts).toHaveBeenCalled();
            expect(repository.deleteShoppingCarts).toHaveBeenCalled();
        });

        it('reports cart cleanup failures after a dependent write fails', async () => {
            jest.mocked(repository.fetchBooksForCarts).mockResolvedValueOnce({
                data: [{ id: 'book-1' }],
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchBooksForCarts>>);
            jest.mocked(repository.fetchUsersForCarts).mockResolvedValueOnce({
                data: cartUsers,
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.fetchUsersForCarts>>);
            jest.mocked(repository.insertShoppingCarts).mockResolvedValueOnce({
                data: generatedCarts(),
                error: null,
            } as unknown as Awaited<ReturnType<typeof repository.insertShoppingCarts>>);
            jest.mocked(repository.insertShoppingCartItems).mockResolvedValueOnce({
                data: null,
                error: 'Cart items insert error',
            });
            jest.mocked(repository.deleteShoppingCarts).mockResolvedValueOnce({
                data: null,
                error: 'Cart cleanup denied',
            });

            await expect(service.addCarts(supabase)).rejects.toThrow(
                'Cleanup was incomplete (cart cleanup: Cart cleanup denied); verify these records before retrying.',
            );
        });
    });

    describe('addWishlists', () => {
        it('should successfully add wishlists', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: [{ id: 'book-1' }, { id: 'book-2' }], error: null },
                {
                    data: [
                        { id: 'user-1' },
                        { id: 'user-2' },
                        { id: 'user-3' },
                        { id: 'user-4' },
                        { id: 'user-5' },
                    ],
                    error: null,
                },
                { data: [], error: null },
            ] as unknown as Awaited<ReturnType<typeof repository.fetchWishlistContext>>);

            jest.mocked(repository.insertWishlistEntries).mockResolvedValueOnce({
                data: createdRows(10, 'wishlist'),
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
                'Unable to generate exactly 10 records; only 0 unique candidates were found during planning.',
            );
        });

        it('should throw an error if inserting wishlist entries fails', async () => {
            jest.mocked(repository.fetchWishlistContext).mockResolvedValueOnce([
                { data: [{ id: 'book-1' }, { id: 'book-2' }], error: null },
                {
                    data: [
                        { id: 'user-1' },
                        { id: 'user-2' },
                        { id: 'user-3' },
                        { id: 'user-4' },
                        { id: 'user-5' },
                    ],
                    error: null,
                },
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
                generatedBooks() as unknown as ReturnType<typeof generateBooksArray>,
            );
            jest.mocked(repository.insertBooks).mockResolvedValueOnce({
                data: generatedBooks(),
                error: null,
            });

            const result = await service.addBooks(supabase);

            expect(result.success).toBe(true);
            expect(repository.fetchBookNaturalKeys).toHaveBeenCalledWith(supabase);
            expect(generateBooksArray).toHaveBeenCalledWith(50, []);
            expect(repository.insertBooks).toHaveBeenCalled();
        });

        it('passes normalized stored book keys to the book planner', async () => {
            jest.mocked(repository.fetchBookNaturalKeys).mockResolvedValueOnce({
                data: [{ title: '  The   Title ', author: 'A Writer' }],
                error: null,
            });
            jest.mocked(generateBooksArray).mockReturnValueOnce(
                generatedBooks() as unknown as ReturnType<typeof generateBooksArray>,
            );
            jest.mocked(repository.insertBooks).mockResolvedValueOnce({
                data: generatedBooks(),
                error: null,
            });

            await service.addBooks(supabase);

            expect(generateBooksArray).toHaveBeenCalledWith(50, ['["the title","a writer"]']);
        });

        it('avoids duplicate book natural keys across sequential command runs', async () => {
            const candidates = Array.from({ length: 100 }, (_, index) => ({
                id: `book-${index}`,
                title: `Title ${index}`,
                author: 'Author',
            }));
            const storedBooks: typeof candidates = [];
            jest.mocked(repository.fetchBookNaturalKeys).mockImplementation(async () => ({
                data: storedBooks.map(({ title, author }) => ({ title, author })),
                error: null,
            }));
            jest.mocked(generateBooksArray).mockImplementation(
                (_count, existingKeys = []) =>
                    candidates
                        .filter(
                            (book) =>
                                !new Set(existingKeys).has(naturalPairKey(book.title, book.author)),
                        )
                        .slice(0, 50) as ReturnType<typeof generateBooksArray>,
            );
            jest.mocked(repository.insertBooks).mockImplementation(async (_client, books) => {
                const inserted = books as typeof candidates;
                storedBooks.push(...inserted);
                return { data: inserted, error: null };
            });

            await service.addBooks(supabase);
            await service.addBooks(supabase);

            expect(
                new Set(storedBooks.map(({ title, author }) => naturalPairKey(title, author))).size,
            ).toBe(100);
        });

        it('should throw an error if inserting books fails', async () => {
            jest.mocked(generateBooksArray).mockReturnValueOnce(
                generatedBooks() as unknown as ReturnType<typeof generateBooksArray>,
            );
            jest.mocked(repository.insertBooks).mockResolvedValueOnce({
                data: null,
                error: 'Insert books error',
            });

            await expect(service.addBooks(supabase)).rejects.toThrow('Insert books error');
        });

        it('rejects a partial book insert result instead of reporting success', async () => {
            jest.mocked(generateBooksArray).mockReturnValueOnce(
                generatedBooks() as unknown as ReturnType<typeof generateBooksArray>,
            );
            jest.mocked(repository.insertBooks).mockResolvedValueOnce({
                data: generatedBooks().slice(0, 49),
                error: null,
            });

            await expect(service.addBooks(supabase)).rejects.toThrow(
                'Book insert returned 49 rows; expected 50.',
            );
        });
    });
});
