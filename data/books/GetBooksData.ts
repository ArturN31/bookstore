'use server';

import { createClient } from '@/utils/db/server';
import { PostgrestResponse } from '@supabase/supabase-js';

/**
 * Retrieves books from the database based on the specified group and type.
 *
 * @param group The book group (e.g., genre or format).
 * @param type The specific type within the group (e.g., Adventure, Comedy, Paperback, Hardcover).
 * @returns A promise that resolves to an array of `Book` objects if successful, or a string error message if not.
 */
export const getBookByGroupAndType = async (group: string, type: string) => {
	const supabase = await createClient();
	const { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('*').eq(group, type);

	if (error) {
		console.error('Error retrieving books:', error);
		return `Failed to retrieve books for group: ${group} and type: ${type}.`;
	}

	if (!data || data.length === 0) return `No books found for group: ${group} and type: ${type}.`;

	return data;
};

/**
 * Retrieves all books from the database.
 *
 * @returns A promise that resolves to an array of `Book` objects if successful, or a string error message if not.
 */
export const getAllBooks = async () => {
	const supabase = await createClient();
	const { data, error }: PostgrestResponse<Book> = await supabase.from('books').select('*');

	if (error) {
		console.error('Error retrieving books:', error);
		return 'Failed to retrieve books.';
	}

	if (!data || data.length === 0) return 'No books found.';

	return data;
};
