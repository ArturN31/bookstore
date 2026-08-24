import * as repository from '@/app/dev-tools/actions/DevToolsRepository';
import { safeSupabaseQuery } from '@/utils/db/safeSupabaseQuery';
import { SupabaseClient } from '@supabase/supabase-js';

jest.mock('@/utils/db/safeSupabaseQuery', () => ({
    safeSupabaseQuery: jest.fn(async (queryFn: () => Promise<unknown>) => {
        return queryFn();
    }),
}));

describe('DevToolsRepository', () => {
    const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: jest.fn((resolve: (value: unknown) => unknown) => resolve({ data: [], error: null })),
    };

    const mockSupabase = {
        from: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as SupabaseClient;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetchAllBooks should execute query and return result', async () => {
        const mockResult = { data: [{ id: '1', title: 'Book 1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const result = await repository.fetchAllBooks(mockSupabase);
        expect(mockSupabase.from).toHaveBeenCalledWith('books');
        expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
        expect(result).toEqual(mockResult);
    });

    it('fetchAllDiscounts should execute query and return result', async () => {
        const mockResult = { data: [{ id: 'd-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const result = await repository.fetchAllDiscounts(mockSupabase);
        expect(mockSupabase.from).toHaveBeenCalledWith('discounts');
        expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
        expect(result).toEqual(mockResult);
    });

    it('insertOrders should execute query with orders payload', async () => {
        const mockResult = { data: [{ id: 'order-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const orders = [{ total: 100 }];
        const result = await repository.insertOrders(mockSupabase, orders);
        expect(mockSupabase.from).toHaveBeenCalledWith('orders');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(orders);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('insertOrderItems should execute query with items payload', async () => {
        const mockResult = { data: [{ id: 'item-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const items = [{ order_id: 'order-1', book_id: 'book-1' }];
        const result = await repository.insertOrderItems(mockSupabase, items);
        expect(mockSupabase.from).toHaveBeenCalledWith('order_items');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(items);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('insertOrderDiscounts should execute query with orderDiscounts payload', async () => {
        const mockResult = { data: [{ id: 'od-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const orderDiscounts = [{ order_id: 'order-1', discount_id: 'd-1' }];
        const result = await repository.insertOrderDiscounts(mockSupabase, orderDiscounts);
        expect(mockSupabase.from).toHaveBeenCalledWith('order_discounts');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(orderDiscounts);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('insertDiscounts should execute query with discounts payload', async () => {
        const mockResult = { data: [{ id: 'd-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const discounts = [{ code: 'SUMMER' }];
        const result = await repository.insertDiscounts(mockSupabase, discounts);
        expect(mockSupabase.from).toHaveBeenCalledWith('discounts');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(discounts);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('fetchBookIds should execute query and return book IDs', async () => {
        const mockResult = { data: [{ id: 'book-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const result = await repository.fetchBookIds(mockSupabase);
        expect(mockSupabase.from).toHaveBeenCalledWith('books');
        expect(mockQueryBuilder.select).toHaveBeenCalledWith('id');
        expect(result).toEqual(mockResult);
    });

    it('updateBookStock should execute query with targetIds and stockQuantity', async () => {
        const mockResult = { data: [], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const targetIds = ['id-1', 'id-2'];
        const result = await repository.updateBookStock(mockSupabase, targetIds, 0);
        expect(mockSupabase.from).toHaveBeenCalledWith('books');
        expect(mockQueryBuilder.update).toHaveBeenCalledWith({ stock_quantity: 0 });
        expect(mockQueryBuilder.in).toHaveBeenCalledWith('id', targetIds);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('fetchBooksForReviews should execute query and return books for reviews', async () => {
        const mockResult = { data: [{ id: 'book-1', title: 'Book 1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const result = await repository.fetchBooksForReviews(mockSupabase);
        expect(mockSupabase.from).toHaveBeenCalledWith('books');
        expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, title');
        expect(result).toEqual(mockResult);
    });

    it('fetchUsersForReviews should execute query and return users for reviews', async () => {
        const mockResult = { data: [{ id: 'user-1', username: 'user1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const result = await repository.fetchUsersForReviews(mockSupabase);
        expect(mockSupabase.from).toHaveBeenCalledWith('users');
        expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, username');
        expect(result).toEqual(mockResult);
    });

    it('insertBookReviews should execute query with reviews payload', async () => {
        const mockResult = { data: [{ id: 'review-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const reviews = [{ rating: 5, book_id: 'book-1', user_id: 'user-1' }];
        const result = await repository.insertBookReviews(mockSupabase, reviews);
        expect(mockSupabase.from).toHaveBeenCalledWith('book_reviews');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(reviews);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('fetchBooksForCarts should execute query and return books for carts', async () => {
        const mockResult = { data: [{ id: 'book-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const result = await repository.fetchBooksForCarts(mockSupabase);
        expect(mockSupabase.from).toHaveBeenCalledWith('books');
        expect(mockQueryBuilder.select).toHaveBeenCalledWith('id');
        expect(result).toEqual(mockResult);
    });

    it('fetchUsersForCarts should execute query and return users for carts', async () => {
        const mockResult = { data: [{ id: 'user-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const result = await repository.fetchUsersForCarts(mockSupabase);
        expect(mockSupabase.from).toHaveBeenCalledWith('users');
        expect(mockQueryBuilder.select).toHaveBeenCalledWith('id');
        expect(result).toEqual(mockResult);
    });

    it('insertShoppingCarts should execute query with cartsData', async () => {
        const mockResult = { data: [{ id: 'cart-1', user_id: 'user-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const cartsData = [{ user_id: 'user-1' }];
        const result = await repository.insertShoppingCarts(mockSupabase, cartsData);
        expect(mockSupabase.from).toHaveBeenCalledWith('shopping_carts');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(cartsData);
        expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, user_id');
        expect(result).toEqual(mockResult);
    });

    it('insertShoppingCartItems should execute query with cartItems', async () => {
        const mockResult = { data: [{ id: 'ci-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const cartItems = [{ cart_id: 'cart-1', book_id: 'book-1', quantity: 1 }];
        const result = await repository.insertShoppingCartItems(mockSupabase, cartItems);
        expect(mockSupabase.from).toHaveBeenCalledWith('shopping_cart_items');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(cartItems);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('fetchWishlistContext should execute multiple queries for context', async () => {
        const mockResult = { data: [], error: null };
        mockQueryBuilder.then.mockImplementation((resolve) => resolve(mockResult));

        const result = await repository.fetchWishlistContext(mockSupabase);
        expect(mockSupabase.from).toHaveBeenCalledWith('books');
        expect(mockSupabase.from).toHaveBeenCalledWith('users');
        expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
        expect(result).toEqual([mockResult, mockResult, mockResult]);
    });

    it('insertWishlistEntries should execute query with wishlist entries', async () => {
        const mockResult = { data: [{ id: 'w-1' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const entries = [{ user_id: 'user-1', book_id: 'book-1' }];
        const result = await repository.insertWishlistEntries(mockSupabase, entries);
        expect(mockSupabase.from).toHaveBeenCalledWith('wishlist');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(entries);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });

    it('insertBooks should execute query with books payload', async () => {
        const mockResult = { data: [{ id: '2' }], error: null };
        mockQueryBuilder.then.mockImplementationOnce((resolve) => resolve(mockResult));

        const booksData = [{ title: 'New Book' }];
        const result = await repository.insertBooks(mockSupabase, booksData);
        expect(mockSupabase.from).toHaveBeenCalledWith('books');
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(booksData);
        expect(mockQueryBuilder.select).toHaveBeenCalled();
        expect(result).toEqual(mockResult);
    });
});
