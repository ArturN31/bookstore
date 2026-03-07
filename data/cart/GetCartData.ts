import { PostgrestResponse, PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';

export const getUsersCartID = async (supabase: SupabaseClient, userID: string) => {
    let { data: shopping_carts, error }: PostgrestResponse<{ id: string }> = await supabase
        .from('shopping_carts')
        .select('id')
        .eq('user_id', userID);
    if (error) {
        if (error.message === `invalid input syntax for type uuid: "User not logged in."`)
            return null;
        console.log(error);
        return null;
    }
    return shopping_carts?.[0]?.id || null;
};

export const createUsersCart = async (supabase: SupabaseClient, userID: string) => {
    const { data, error } = await supabase
        .from('shopping_carts')
        .insert([{ user_id: userID }])
        .select();
    if (error) {
        console.log('Error creating cart:', error);
        return null;
    }
    if (data) return true;
    else return null;
};

export const addItemToUsersCart = async (
    supabase: SupabaseClient,
    cartID: string,
    bookID: string,
    bookQuantity: number,
) => {
    const { data, error } = await supabase
        .from('shopping_cart_items')
        .insert([{ cart_id: cartID, book_id: bookID, quantity: bookQuantity }])
        .select();
    if (error) {
        console.log('Error adding cart items:', error);
        return null;
    }
    if (data) return true;
    else null;
};

export const updateItemInUsersCart = async (
    supabase: SupabaseClient,
    cartID: string,
    bookID: string,
    bookQuantity: number,
) => {
    const { data, error } = await supabase
        .from('shopping_cart_items')
        .update([{ quantity: bookQuantity }])
        .eq('cart_id', cartID)
        .eq('book_id', bookID)
        .select();
    if (error) {
        console.log('Error updating cart item:', error);
        return null;
    }
    if (data) return true;
    else null;
};

export const removeItemFromUsersCart = async (
    supabase: SupabaseClient,
    cartID: string,
    bookID: string,
) => {
    const { data, error } = await supabase
        .from('shopping_cart_items')
        .delete()
        .eq('cart_id', cartID)
        .eq('book_id', bookID)
        .select();
    if (error) {
        console.log('Error removing cart item:', error);
        return null;
    }
    if (data) return true;
    else null;
};

export const getCartData = async (supabase: SupabaseClient, userID: string) => {
    type UsersCart = {
        cartID: string;
        cartItems: {
            bookDetails: Book;
            quantity: number;
        }[];
    };

    const { data, error }: PostgrestSingleResponse<UsersCart | null> = await supabase
        .from('shopping_carts')
        .select(
            `
            cartID:id,
            cartItems:shopping_cart_items (
                quantity,
                created_at,
                bookDetails: books (*) 
            )
            `,
        )
        .eq('user_id', userID)
        .order('created_at', { referencedTable: 'shopping_cart_items', ascending: true })
        .maybeSingle();

    if (error) {
        console.error('Database error fetching cart:', error);
        return { cartID: null, books: [], error };
    }

    const formattedBooks = (data?.cartItems || []).map((item) => ({
        ...item.bookDetails,
        quantity: item.quantity,
    }));

    return {
        cartID: data?.cartID || null,
        books: formattedBooks,
    };
};
