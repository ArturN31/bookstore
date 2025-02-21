import { createClient } from '@/utils/db/server';

export const getUsersCartID = async (userID: string): Promise<string | null> => {
	const supabase = await createClient();
	let { data: shopping_carts, error } = await supabase.from('shopping_carts').select('id').eq('user_id', userID);
	if (error) console.log(error);
	return shopping_carts && shopping_carts.length > 0 ? shopping_carts[0].id : null;
};

export const createUsersCart = async (userID: string) => {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('shopping_carts')
		.insert([{ user_id: userID }])
		.select();
	if (error) console.log(error);
	if (data) return 'Cart created.';
	else return null;
};

export const addItemToUsersCart = async (cartID: string, bookID: string, bookQuantity: number) => {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('shopping_cart_items')
		.insert([{ cart_id: cartID, book_id: bookID, quantity: bookQuantity }])
		.select();
	if (error) console.log(error);
	if (data) return 'Item added to cart.';
	else null;
};
