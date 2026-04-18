import {
    findCartIdByUserId,
    createCart,
    upsertItem,
    updateItem,
    deleteItem,
    fetchFullCartWithBooks,
} from '@/data/cart/CartRepository';

describe('CartRepository', () => {
    const mockSupabase: any = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
        single: jest.fn(),
        upsert: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findCartIdByUserId', () => {
        it('should query shopping_carts for user id', async () => {
            mockSupabase.maybeSingle.mockResolvedValue({ data: { id: 'cart-123' }, error: null });

            await findCartIdByUserId(mockSupabase, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('shopping_carts');
            expect(mockSupabase.select).toHaveBeenCalledWith('id');
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(mockSupabase.maybeSingle).toHaveBeenCalled();
        });

        it('should return result from maybeSingle', async () => {
            mockSupabase.maybeSingle.mockResolvedValue({ data: { id: 'cart-123' }, error: null });

            const result = await findCartIdByUserId(mockSupabase, 'user-123');

            expect(result.data?.id).toBe('cart-123');
        });
    });

    describe('createCart', () => {
        it('should insert new cart with user_id', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'new-cart' }, error: null });

            await createCart(mockSupabase, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('shopping_carts');
            expect(mockSupabase.insert).toHaveBeenCalledWith([{ user_id: 'user-123' }]);
            expect(mockSupabase.select).toHaveBeenCalledWith('id');
            expect(mockSupabase.single).toHaveBeenCalled();
        });

        it('should return created cart id', async () => {
            mockSupabase.single.mockResolvedValue({ data: { id: 'new-cart' }, error: null });

            const result = await createCart(mockSupabase, 'user-123');

            expect(result.data?.id).toBe('new-cart');
        });
    });

    describe('upsertItem', () => {
        it('should upsert item with cart_id, book_id, quantity', async () => {
            mockSupabase.upsert.mockResolvedValue({ data: null, error: null });

            await upsertItem(mockSupabase, 'cart-123', 'book-1', 2);

            expect(mockSupabase.from).toHaveBeenCalledWith('shopping_cart_items');
            expect(mockSupabase.upsert).toHaveBeenCalledWith(
                { cart_id: 'cart-123', book_id: 'book-1', quantity: 2 },
                { onConflict: 'cart_id, book_id' },
            );
        });
    });

    describe('updateItem', () => {
        it('should update item quantity matching cart and book', async () => {
            mockSupabase.match.mockResolvedValue({ data: null, error: null });

            await updateItem(mockSupabase, 'cart-123', 'book-1', 3);

            expect(mockSupabase.from).toHaveBeenCalledWith('shopping_cart_items');
            expect(mockSupabase.update).toHaveBeenCalledWith({ quantity: 3 });
            expect(mockSupabase.match).toHaveBeenCalledWith({ cart_id: 'cart-123', book_id: 'book-1' });
        });
    });

    describe('deleteItem', () => {
        it('should delete item matching cart and book', async () => {
            mockSupabase.match.mockResolvedValue({ data: null, error: null });

            await deleteItem(mockSupabase, 'cart-123', 'book-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('shopping_cart_items');
            expect(mockSupabase.delete).toHaveBeenCalled();
            expect(mockSupabase.match).toHaveBeenCalledWith({ cart_id: 'cart-123', book_id: 'book-1' });
        });
    });

    describe('fetchFullCartWithBooks', () => {
        it('should query cart with all items and books', async () => {
            mockSupabase.maybeSingle.mockResolvedValue({ data: { id: 'cart-123' }, error: null });

            await fetchFullCartWithBooks(mockSupabase, 'user-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('shopping_carts');
            expect(mockSupabase.select).toHaveBeenCalled();
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
                referencedTable: 'shopping_cart_items',
                ascending: true,
            });
            expect(mockSupabase.maybeSingle).toHaveBeenCalled();
        });

        it('should return full cart data', async () => {
            const cartData = {
                id: 'cart-123',
                shopping_cart_items: [
                    { quantity: 2, books: { id: 'book-1', title: 'Test' } },
                ],
            };
            mockSupabase.maybeSingle.mockResolvedValue({ data: cartData, error: null });

            const result = await fetchFullCartWithBooks(mockSupabase, 'user-123');

            expect(result.data).toEqual(cartData);
        });
    });
});
