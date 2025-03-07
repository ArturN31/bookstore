import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';

/**
 * Retrieves a book from the database by book id.
 *
 * @param bookID Id of a book.
 *
 * @returns A promise that resolves to a `Book` object if successful, or a string error message if not.
 */
export const getBook = async (bookID: string) => {
	const supabase = await createClient();
	const { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('*').eq('id', bookID);

	if (error) {
		console.error('Error retrieving book:', error);
		return null;
	}

	if (!data || data.length === 0) return null;

	return data[0];
};
