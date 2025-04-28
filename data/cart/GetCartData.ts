import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export const getUsersCartID = async (userID: string) => {
	const supabase = await createClient();
	let { data: shopping_carts, error }: PostgrestResponse<{ id: string }> = await supabase
		.from('shopping_carts')
		.select('id')
		.eq('user_id', userID);
	if (error) {
		if (error.message === `invalid input syntax for type uuid: "User not logged in."`) return null;
		console.log(error);
		return null;
	}
	return shopping_carts && shopping_carts.length > 0 ? shopping_carts[0].id : null;
};

export const createUsersCart = async (userID: string) => {
	const supabase = await createClient();
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

export const addItemToUsersCart = async (cartID: string, bookID: string, bookQuantity: number) => {
	const supabase = await createClient();
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

export const updateItemInUsersCart = async (cartID: string, bookID: string, bookQuantity: number) => {
	const supabase = await createClient();
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

export const removeItemFromUsersCart = async (cartID: string, bookID: string) => {
	const supabase = await createClient();
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

export const isAddedToCart = async (cartID: string, bookID: string) => {
	const supabase = await createClient();
	let {
		data,
		error,
	}: PostgrestResponse<{
		id: number;
		created_at: string;
		updated_at: string;
		cart_id: string;
		book_id: string;
		quantity: number;
	}> = await supabase.from('shopping_cart_items').select('*').eq('cart_id', cartID).eq('book_id', bookID);
	if (error) {
		console.log('Error fetching cart item:', error);
		return false;
	}
	if (data && data.length > 0) {
		return data;
	} else {
		return false;
	}
};

export const getBooksAddedToCart = async (cartID: string) => {
	const supabase = await createClient();
	let {
		data,
		error,
	}: PostgrestResponse<{
		id: number;
		created_at: string;
		updated_at: string;
		cart_id: string;
		book_id: string;
		quantity: number;
	}> = await supabase.from('shopping_cart_items').select('*').eq('cart_id', cartID);
	if (error) {
		console.log('Error fetching cart item:', error);
		return null;
	}
	if (data && data.length > 0) {
		return data;
	} else {
		return null;
	}
};
